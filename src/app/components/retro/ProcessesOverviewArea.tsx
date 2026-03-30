import { useState, useRef, useCallback } from "react";
import { ThumbsUp, ThumbsDown, X } from "lucide-react";
import { useStorage, useMutation, useSelf } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";

// -------- Constants --------
const STICKY_COLORS = [
  "#fde68a",
  "#bbf7d0",
  "#bfdbfe",
  "#fecaca",
  "#ddd6fe",
  "#fed7aa",
  "#fbcfe8",
  "#e5e7eb",
];

const PROCESS_GROUPS = [
  { id: "refinement", label: "Refinement" },
  { id: "investigation", label: "Investigation" },
  { id: "kickoff", label: "Kick-off" },
  { id: "pr-reviews", label: "PR Reviews" },
  { id: "ux-reviews", label: "UX Reviews" },
  { id: "content-reviews", label: "Content Reviews" },
  { id: "manual-testing", label: "Manual Testing" },
  { id: "documentation", label: "Documentation" },
];

const DEFAULT_ITEMS_PER_GROUP = 10;

const STICKY_ZONES = [
  { key: "suggestions", label: "Suggestions" },
  { key: "issues", label: "Issues" },
  { key: "ideas", label: "Ideas" },
];

interface ProcessSticky {
  id: string;
  content: string;
  x: number;
  y: number;
  color: string;
  userName: string;
  zone: string;
}

// -------- Sticky Note --------
interface StickyNoteItemProps {
  note: ProcessSticky;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function StickyNoteItem({ note, onUpdate, onDelete, onMove, containerRef }: StickyNoteItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "TEXTAREA" || (e.target as HTMLElement).tagName === "BUTTON") return;
    e.preventDefault();
    setIsDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const parent = containerRef.current.getBoundingClientRect();
      const x = ((ev.clientX - parent.left - offsetRef.current.x) / parent.width) * 100;
      const y = ((ev.clientY - parent.top - offsetRef.current.y) / parent.height) * 100;
      onMove(note.id, Math.max(0, Math.min(88, x)), Math.max(0, Math.min(88, y)));
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [note.id, onMove, containerRef]);

  return (
    <div
      className="absolute w-36 min-h-[9rem] p-2 shadow-lg rounded-sm flex flex-col"
      style={{
        backgroundColor: note.color,
        left: `${note.x}%`,
        top: `${note.y}%`,
        cursor: isDragging ? "grabbing" : "grab",
        zIndex: isDragging ? 50 : 10,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex justify-between items-start mb-1">
        <span className="text-[9px] text-gray-500 font-medium truncate max-w-[80%]">{note.userName}</span>
        <button onClick={() => onDelete(note.id)} className="p-0.5 rounded-full hover:bg-black/10">
          <X className="w-3 h-3 text-gray-600" />
        </button>
      </div>
      <textarea
        className="flex-1 w-full bg-transparent resize-none text-xs text-gray-800 placeholder-gray-400 outline-none leading-relaxed"
        placeholder="Write here…"
        value={note.content}
        onChange={(e) => onUpdate(note.id, e.target.value)}
        rows={5}
      />
    </div>
  );
}

// -------- Sticky Zone Column --------
interface StickyZoneProps {
  zoneKey: string;
  label: string;
  selectedColor: string;
  stickies: ProcessSticky[];
  onAddSticky: (zone: string, color: string, x: number, y: number) => void;
  onUpdateSticky: (id: string, content: string) => void;
  onDeleteSticky: (id: string) => void;
  onMoveSticky: (id: string, x: number, y: number) => void;
  minHeight: number;
}

function StickyZone({ zoneKey, label, selectedColor, stickies, onAddSticky, onUpdateSticky, onDeleteSticky, onMoveSticky, minHeight }: StickyZoneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".sticky-note-item")) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onAddSticky(zoneKey, selectedColor, Math.max(0, Math.min(85, x)), Math.max(0, Math.min(85, y)));
  };

  return (
    <div className="flex flex-col flex-1 border-l border-gray-200 first:border-l-0">
      <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 text-center">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</span>
      </div>
      <div
        ref={containerRef}
        className="relative flex-1 cursor-crosshair overflow-hidden bg-gray-50"
        style={{ minHeight }}
        onClick={handleClick}
      >
        {stickies.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs pointer-events-none select-none text-center px-2">
            Click to add a sticky
          </p>
        )}
        {stickies.map((note) => (
          <div key={note.id} className="sticky-note-item">
            <StickyNoteItem
              note={note}
              onUpdate={onUpdateSticky}
              onDelete={onDeleteSticky}
              onMove={onMoveSticky}
              containerRef={containerRef as React.RefObject<HTMLDivElement>}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// -------- Vote Row --------
interface VoteRowProps {
  groupId: string;
  itemIndex: number;
  text: string;
  votes: { likes: number; dislikes: number; likedBy: string[]; dislikedBy: string[] } | undefined;
  userName: string;
  onVote: (groupId: string, itemIndex: number, type: "like" | "dislike") => void;
  onTextChange: (groupId: string, itemIndex: number, text: string) => void;
}

function VoteRow({ groupId, itemIndex, text, votes, userName, onVote, onTextChange }: VoteRowProps) {
  const hasLiked = votes?.likedBy?.includes(userName) ?? false;
  const hasDisliked = votes?.dislikedBy?.includes(userName) ?? false;

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors min-w-0">
      <span className="text-xs text-gray-400 w-4 shrink-0">{itemIndex + 1}.</span>
      <input
        type="text"
        className="flex-1 text-sm text-gray-700 bg-transparent outline-none border-b border-transparent focus:border-gray-300 transition-colors"
        value={text}
        onChange={(e) => onTextChange(groupId, itemIndex, e.target.value)}
        placeholder="Text item…"
      />
      <div className="flex items-center gap-1 shrink-0">
        <button
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
            hasLiked ? "bg-green-200 text-green-800" : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700"
          }`}
          onClick={() => onVote(groupId, itemIndex, "like")}
        >
          <ThumbsUp className="w-3 h-3" />
          <span>{votes?.likes ?? 0}</span>
        </button>
        <button
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
            hasDisliked ? "bg-red-200 text-red-800" : "bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-700"
          }`}
          onClick={() => onVote(groupId, itemIndex, "dislike")}
        >
          <ThumbsDown className="w-3 h-3" />
          <span>{votes?.dislikes ?? 0}</span>
        </button>
      </div>
    </div>
  );
}

// -------- Process Group --------
interface ProcessGroupProps {
  group: { id: string; label: string };
  itemTexts: string[];
  votes: Map<string, { likes: number; dislikes: number; likedBy: string[]; dislikedBy: string[] }>;
  userName: string;
  onVote: (groupId: string, itemIndex: number, type: "like" | "dislike") => void;
  onTextChange: (groupId: string, itemIndex: number, text: string) => void;
  minHeight: number;
}

function ProcessGroup({ group, itemTexts, votes, userName, onVote, onTextChange, minHeight }: ProcessGroupProps) {
  return (
    <div className="flex flex-col border-b-2 border-gray-200 last:border-b-0" style={{ minHeight }}>
      {/* Group header */}
      <div className="px-4 py-2 bg-violet-600 text-white">
        <h3 className="font-bold text-sm tracking-wide">{group.label}</h3>
      </div>
      {/* Items */}
      <div className="flex-1">
        {Array.from({ length: DEFAULT_ITEMS_PER_GROUP }).map((_, i) => (
          <VoteRow
            key={i}
            groupId={group.id}
            itemIndex={i}
            text={itemTexts[i] ?? ""}
            votes={votes.get(`${group.id}-${i}`)}
            userName={userName}
            onVote={onVote}
            onTextChange={onTextChange}
          />
        ))}
      </div>
    </div>
  );
}

// -------- Main ProcessesOverviewArea --------
export function ProcessesOverviewArea() {
  const [selectedColor, setSelectedColor] = useState(STICKY_COLORS[0]);
  const [itemTexts, setItemTexts] = useState<Record<string, string[]>>(() => ({
    "refinement": [
      "Epic Refinement: Complete epic requirements",
      "Epic Refinement: Complete stories requirements",
      "Epic Refinement: UX pre-review of required UI changes",
      "Epic Refinement: Content writer pre-review of content/label/text changes",
      "Story Refinement: Complete story requirements",
      "Story Refinement: UX pre-review of required UI changes",
      "Story Refinement: Content writer pre-review of content/label/text changes",
      "",
      "",
      "",
    ],
    "investigation": [
      "OC Description: Story Breakdown with relevant details outlined",
      "OC Description: Functional Requirements for Epic and Stories created",
      "OC Description: Acceptance Criteria defined",
      "*NEW* New POC Section: Recommended implementation approach Pros & Cons",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    "kickoff": [
      "Epic Refinement: Request attendance in advance of required attendees",
      "Epic Refinement: Visual Aid (orgs, screenshots, diagrams) ready to show",
      "Story Refinement: Request attendance in advance of required attendees",
      "Story Refinement: Visual Aid (orgs, screenshots, diagrams) ready to show",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    "pr-reviews": [
      "Upon Creation: Fill in summary",
      "Upon Creation: Check-off checklist in summary",
      "Upon Creation: No default reviewers",
      "PR Channel: Use emojis for PR identification, reviewing, manual testing, approvals and merged status",
      "PR Channel: Tag team members under PR when over 2 hours without 2 reviewers",
      "PR Channel: Tag assigned reviewers when requiring re-reviews",
      "",
      "",
      "",
      "",
    ],
    "ux-reviews":      Array.from({ length: DEFAULT_ITEMS_PER_GROUP }, () => ""),
    "content-reviews": Array.from({ length: DEFAULT_ITEMS_PER_GROUP }, () => ""),
    "manual-testing":  Array.from({ length: DEFAULT_ITEMS_PER_GROUP }, () => ""),
    "documentation":   Array.from({ length: DEFAULT_ITEMS_PER_GROUP }, () => ""),
  }));

  const self = useSelf();
  const userName: string = (self?.presence?.name as string | undefined) ?? "Anonymous";

  type StoredVote = { id: string; groupId: string; itemIndex: number; likes: number; dislikes: number; likedBy: readonly string[]; dislikedBy: readonly string[] };
  const rawVotes = (useStorage((root) => root.retroProcessVotes) ?? []) as unknown as readonly StoredVote[];
  const allRetroStickies = (useStorage((root) => root.retroStickies) ?? []) as unknown as ProcessSticky[];
  const processStickies = allRetroStickies.filter((s: ProcessSticky) =>
    STICKY_ZONES.some((z) => `process-${z.key}` === s.zone)
  );

  // Build votes map: key = "groupId-itemIndex"
  const votesMap = new Map<string, { likes: number; dislikes: number; likedBy: string[]; dislikedBy: string[] }>();
  rawVotes.forEach((v: StoredVote) => {
    votesMap.set(`${v.groupId}-${v.itemIndex}`, {
      likes: v.likes,
      dislikes: v.dislikes,
      likedBy: [...v.likedBy],
      dislikedBy: [...v.dislikedBy],
    });
  });

  const vote = useMutation(({ storage }, groupId: string, itemIndex: number, type: "like" | "dislike") => {
    const list = storage.get("retroProcessVotes") as any;
    const index = list.findIndex((v: any) => v.get("groupId") === groupId && v.get("itemIndex") === itemIndex);

    if (index === -1) {
      const newVote = new LiveObject({
        id: `${groupId}-${itemIndex}`,
        groupId,
        itemIndex,
        likes: type === "like" ? 1 : 0,
        dislikes: type === "dislike" ? 1 : 0,
        likedBy: type === "like" ? [userName] : [],
        dislikedBy: type === "dislike" ? [userName] : [],
      });
      list.push(newVote);
      return;
    }

    const item = list.get(index);
    const likedBy: string[] = item.get("likedBy") || [];
    const dislikedBy: string[] = item.get("dislikedBy") || [];
    const likes: number = item.get("likes") || 0;
    const dislikes: number = item.get("dislikes") || 0;
    const hasLiked = likedBy.includes(userName);
    const hasDisliked = dislikedBy.includes(userName);

    if (type === "like") {
      if (hasLiked) {
        item.set("likedBy", likedBy.filter((u: string) => u !== userName));
        item.set("likes", Math.max(0, likes - 1));
      } else if (hasDisliked) {
        item.set("dislikedBy", dislikedBy.filter((u: string) => u !== userName));
        item.set("dislikes", Math.max(0, dislikes - 1));
        item.set("likedBy", [...likedBy, userName]);
        item.set("likes", likes + 1);
      } else {
        item.set("likedBy", [...likedBy, userName]);
        item.set("likes", likes + 1);
      }
    } else {
      if (hasDisliked) {
        item.set("dislikedBy", dislikedBy.filter((u: string) => u !== userName));
        item.set("dislikes", Math.max(0, dislikes - 1));
      } else if (hasLiked) {
        item.set("likedBy", likedBy.filter((u: string) => u !== userName));
        item.set("likes", Math.max(0, likes - 1));
        item.set("dislikedBy", [...dislikedBy, userName]);
        item.set("dislikes", dislikes + 1);
      } else {
        item.set("dislikedBy", [...dislikedBy, userName]);
        item.set("dislikes", dislikes + 1);
      }
    }
  }, [userName]);

  const addSticky = useMutation(({ storage }, zone: string, color: string, x: number, y: number) => {
    const list = storage.get("retroStickies") as any;
    list.push(
      new LiveObject({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        content: "",
        x,
        y,
        color,
        userName,
        zone,
      })
    );
  }, [userName]);

  const updateSticky = useMutation(({ storage }, id: string, content: string) => {
    const list = storage.get("retroStickies") as any;
    const index = list.findIndex((s: any) => s.get("id") === id);
    if (index !== -1) list.get(index).set("content", content);
  }, []);

  const deleteSticky = useMutation(({ storage }, id: string) => {
    const list = storage.get("retroStickies") as any;
    const index = list.findIndex((s: any) => s.get("id") === id);
    if (index !== -1) list.delete(index);
  }, []);

  const moveSticky = useMutation(({ storage }, id: string, x: number, y: number) => {
    const list = storage.get("retroStickies") as any;
    const index = list.findIndex((s: any) => s.get("id") === id);
    if (index !== -1) {
      list.get(index).set("x", x);
      list.get(index).set("y", y);
    }
  }, []);

  const handleTextChange = (groupId: string, itemIndex: number, text: string) => {
    setItemTexts((prev) => ({
      ...prev,
      [groupId]: Object.assign([...((prev[groupId] as string[]) || [])], { [itemIndex]: text }),
    }));
  };

  // Calculate min height as the tallest content — each group row ~40px each item + 36px header
  const groupMinHeight = DEFAULT_ITEMS_PER_GROUP * 42 + 40;

  return (
    <div className="border-2 border-gray-400 rounded-xl bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-violet-700 text-white px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold tracking-wide">Processes Overview</h2>
        {/* Sticky colour picker */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium opacity-80">Sticky colour:</span>
          {STICKY_COLORS.map((c) => (
            <button
              key={c}
              className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: selectedColor === c ? "white" : "transparent",
                transform: selectedColor === c ? "scale(1.25)" : undefined,
              }}
              onClick={() => setSelectedColor(c)}
              title={c}
            />
          ))}
        </div>
      </div>

      <div className="flex">
        {/* ===== Left: Process Groups (Lists + Votes) ===== */}
        <div className="shrink-0 border-r-2 border-gray-200 overflow-hidden" style={{ width: 800 }}>
          {PROCESS_GROUPS.map((group) => (
            <ProcessGroup
              key={group.id}
              group={group}
              itemTexts={itemTexts[group.id] || []}
              votes={votesMap}
              userName={userName}
              onVote={vote}
              onTextChange={handleTextChange}
              minHeight={groupMinHeight}
            />
          ))}
        </div>

        {/* ===== Right: Sticky note zones ===== */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex flex-1">
            {STICKY_ZONES.map((zone) => {
              const zoneKey = `process-${zone.key}`;
              const zoneStickies = processStickies.filter((s) => s.zone === zoneKey);
              return (
                <StickyZone
                  key={zone.key}
                  zoneKey={zoneKey}
                  label={zone.label}
                  selectedColor={selectedColor}
                  stickies={zoneStickies}
                  onAddSticky={addSticky}
                  onUpdateSticky={updateSticky}
                  onDeleteSticky={deleteSticky}
                  onMoveSticky={moveSticky}
                  minHeight={PROCESS_GROUPS.length * groupMinHeight}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
