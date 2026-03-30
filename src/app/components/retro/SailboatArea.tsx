import { useState, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { useStorage, useMutation, useSelf } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";

const STICKY_COLORS = [
  "#fde68a", // yellow
  "#bbf7d0", // green
  "#bfdbfe", // blue
  "#fecaca", // red
  "#ddd6fe", // purple
  "#fed7aa", // orange
  "#fbcfe8", // pink
  "#e5e7eb", // gray
];

interface StickyNote {
  id: string;
  content: string;
  x: number;
  y: number;
  color: string;
  userName: string;
  zone: string;
}

const ZONES = [
  {
    key: "iceberg",
    label: "Risks Encountered",
    icon: "iceberg",
  },
  {
    key: "wind",
    label: "What has helped the team move forward",
    icon: "wind",
  },
  {
    key: "anchor",
    label: "Everything that has slowed the team down",
    icon: "anchor",
  },
  {
    key: "island",
    label: "Notes on the team reaching the release goals",
    icon: "island",
  },
];

// -------- SVG illustrations --------
function IcebergSVG() {
  return (
    <svg viewBox="0 0 160 120" className="w-40 h-28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Water line */}
      <line x1="0" y1="70" x2="160" y2="70" stroke="#60a5fa" strokeWidth="2" strokeDasharray="4 2" />
      {/* Above water */}
      <polygon points="60,20 100,20 115,70 45,70" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1.5" />
      {/* Below water */}
      <polygon points="45,70 115,70 130,115 30,115" fill="#93c5fd" stroke="#60a5fa" strokeWidth="1.5" opacity="0.7" />
      <text x="80" y="50" textAnchor="middle" fontSize="9" fill="#1e40af" fontStyle="italic">ICE</text>
      <text x="80" y="95" textAnchor="middle" fontSize="8" fill="#1e3a8a" fontStyle="italic" opacity="0.8">BERG</text>
    </svg>
  );
}

function WindSVG() {
  return (
    <svg viewBox="0 0 160 100" className="w-40 h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Wind swirls */}
      <path d="M10,30 Q40,10 80,30 Q120,50 150,30" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M10,50 Q40,30 90,50 Q130,70 150,50" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M10,70 Q50,55 95,70 Q130,85 150,70" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Arrow tips */}
      <polygon points="150,30 140,25 140,35" fill="#60a5fa" />
      <polygon points="150,50 140,45 140,55" fill="#3b82f6" />
      <polygon points="150,70 140,65 140,75" fill="#60a5fa" />
    </svg>
  );
}

function AnchorSVG() {
  return (
    <svg viewBox="0 0 120 140" className="w-28 h-36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ring */}
      <circle cx="60" cy="20" r="12" stroke="#374151" strokeWidth="2.5" fill="none" />
      {/* Horizontal bar */}
      <line x1="30" y1="38" x2="90" y2="38" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
      {/* Vertical shaft */}
      <line x1="60" y1="38" x2="60" y2="115" stroke="#374151" strokeWidth="2.5" />
      {/* Curved bottom */}
      <path d="M25,90 Q25,125 60,120 Q95,125 95,90" stroke="#374151" strokeWidth="2.5" fill="#e5e7eb" />
      {/* Left fluke */}
      <line x1="60" y1="115" x2="25" y2="90" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
      {/* Right fluke */}
      <line x1="60" y1="115" x2="95" y2="90" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function IslandSVG() {
  return (
    <svg viewBox="0 0 200 120" className="w-48 h-28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Water */}
      <ellipse cx="100" cy="100" rx="90" ry="18" fill="#bfdbfe" />
      {/* Island base */}
      <ellipse cx="100" cy="90" rx="65" ry="22" fill="#fde68a" />
      {/* Sandy beach */}
      <ellipse cx="100" cy="88" rx="55" ry="15" fill="#fcd34d" />
      {/* Palm tree trunk */}
      <path d="M100,20 Q105,50 100,85" stroke="#92400e" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Palm leaves */}
      <path d="M100,20 Q80,5 60,15" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M100,20 Q85,0 100,5" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M100,20 Q120,5 135,18" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M100,20 Q118,10 122,25" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function SailboatSVG() {
  return (
    <svg viewBox="0 0 90 130" className="w-20 h-28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hull */}
      <path d="M10,90 Q45,105 80,90 L75,80 L15,80 Z" fill="#f97316" stroke="#ea580c" strokeWidth="1.5" />
      {/* Mast */}
      <line x1="45" y1="80" x2="45" y2="20" stroke="#374151" strokeWidth="2" />
      {/* Main sail */}
      <path d="M45,22 L45,78 L15,78 Z" fill="white" stroke="#d1d5db" strokeWidth="1" />
      {/* Front sail */}
      <path d="M45,22 L45,78 L70,78 Z" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="1" />
      {/* Flag */}
      <polygon points="45,22 60,28 45,34" fill="#ef4444" />
    </svg>
  );
}

// -------- Sticky Note Component --------
interface StickyNoteProps {
  note: StickyNote;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function StickyNoteItem({ note, onUpdate, onDelete, onMove, containerRef }: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const noteRef = useRef<HTMLDivElement>(null);

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
      ref={noteRef}
      className="absolute w-36 min-h-[9rem] p-2 shadow-lg rounded-sm flex flex-col select-none"
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
        <button
          onClick={() => onDelete(note.id)}
          className="p-0.5 rounded-full hover:bg-black/10 transition-colors"
        >
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

// -------- Zone Component --------
interface ZoneProps {
  zoneKey: string;
  label: string;
  icon: string;
  selectedColor: string;
  stickies: StickyNote[];
  onAddSticky: (zone: string, color: string, x: number, y: number) => void;
  onUpdateSticky: (id: string, content: string) => void;
  onDeleteSticky: (id: string) => void;
  onMoveSticky: (id: string, x: number, y: number) => void;
}

function Zone({ zoneKey, label, icon, selectedColor, stickies, onAddSticky, onUpdateSticky, onDeleteSticky, onMoveSticky }: ZoneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoneClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".sticky-note")) return;
    if ((e.target as HTMLElement).closest("[data-no-add]")) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onAddSticky(zoneKey, selectedColor, Math.max(0, Math.min(85, x)), Math.max(0, Math.min(85, y)));
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-[360px] bg-slate-50 border-b border-gray-200 last:border-b-0 cursor-crosshair overflow-hidden"
      onClick={handleZoneClick}
    >
      {/* Illustration + label */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none" data-no-add="true">
        {icon === "iceberg" && <IcebergSVG />}
        {icon === "wind" && <WindSVG />}
        {icon === "anchor" && <AnchorSVG />}
        {icon === "island" && <IslandSVG />}
        <p className="mt-1 text-xs italic text-gray-500 text-center max-w-xs px-2">{label}</p>
      </div>
      {/* Sticky notes */}
      {stickies.map((note) => (
        <div key={note.id} className="sticky-note">
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
  );
}

// -------- Main SailboatArea --------
export function SailboatArea() {
  const [selectedColor, setSelectedColor] = useState(STICKY_COLORS[0]);
  const self = useSelf();
  const userName = self?.presence?.name || "Anonymous";

  const stickies = (useStorage((root) => root.retroStickies) ?? []) as unknown as StickyNote[];
  const sailboatStickies = stickies.filter((s: StickyNote) => ZONES.some((z) => z.key === s.zone));

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

  return (
    <div className="border-2 border-gray-400 rounded-xl bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-sky-700 text-white px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold tracking-wide">Sailboat Retrospective</h2>
        {/* Colour picker */}
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
        {/* Left sidebar: sailboat + arrow */}
        <div className="flex flex-col items-center py-6 px-4 bg-sky-50 border-r-2 border-gray-200 gap-4" style={{ minWidth: 120 }}>
          <div title="Sailboat">
            <SailboatSVG />
          </div>
          {/* Vertical arrow */}
          <div className="flex flex-col items-center flex-1 gap-1">
            <div className="w-0.5 flex-1 bg-sky-300 rounded-full" style={{ minHeight: 80 }} />
            <svg viewBox="0 0 20 20" className="w-5 h-5 text-sky-400" fill="currentColor">
              <path d="M10 18l-7-8h4V2h6v8h4z" />
            </svg>
          </div>
        </div>

        {/* Zones */}
        <div className="flex-1 flex flex-col">
          {ZONES.map((zone) => (
            <Zone
              key={zone.key}
              zoneKey={zone.key}
              label={zone.label}
              icon={zone.icon}
              selectedColor={selectedColor}
              stickies={sailboatStickies.filter((s: StickyNote) => s.zone === zone.key)}
              onAddSticky={addSticky}
              onUpdateSticky={updateSticky}
              onDeleteSticky={deleteSticky}
              onMoveSticky={moveSticky}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
