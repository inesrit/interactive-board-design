import React, { useState, useRef, useCallback, useEffect, memo } from "react";
import { Upload, X, GripVertical, Pencil, Eraser } from "lucide-react";
import { useStorage, useMutation, useSelf } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";

// ─── Constants ────────────────────────────────────────────────────────────────
const STICKY_COLORS = [
  "#fde68a", "#bbf7d0", "#bfdbfe", "#fecaca",
  "#ddd6fe", "#fed7aa", "#fbcfe8", "#e5e7eb",
];

const JIRA_COLUMNS = [
  { key: "Issue Type",                label: "Type",     defaultWidth: 70  },
  { key: "Issue key",                 label: "Issue",    defaultWidth: 110 },
  { key: "Summary",                   label: "Summary",  defaultWidth: 220 },
  { key: "Created",                   label: "Created",  defaultWidth: 120 },
  { key: "Resolved",                  label: "Resolved", defaultWidth: 120 },
  { key: "Assignee",                  label: "Assignee", defaultWidth: 130 },
  { key: "Custom field (Epic Color)", label: "Epic",     defaultWidth: 80  },
];

const PERSON_COLUMNS = [
  { key: "Amy",       color: "#a855f7" },
  { key: "Christian", color: "#3b82f6" },
  { key: "Hal",       color: "#22c55e" },
  { key: "Ines",      color: "#f97316" },
  { key: "Jack",      color: "#ec4899" },
  { key: "Martyn",    color: "#eab308" },
];

const RIGHT_SECTIONS = [
  { key: "highs",        label: "Highs"         },
  { key: "lows",         label: "Lows"          },
  { key: "animalMagic",  label: "Animal Magic"  },
  { key: "musicalVibes", label: "Musical Vibes" },
];

// Canvas logical resolution — tall enough for ~180 rows at ≈28 logical px each
const CANVAS_W   = 160;
const CANVAS_H   = 5000;
const COL_CANVAS = 160; // display width per person column

// ─── Types ────────────────────────────────────────────────────────────────────
type CsvRow      = Record<string, string>;
type ImageData   = { id: string; dataUrl: string; x: number; y: number; width: number; height: number };
type SectionImages = Record<string, ImageData[]>;

interface CalSticky {
  id: string; content: string; x: number; y: number;
  color: string; userName: string; zone: string;
}

// ─── CSV Parsing ──────────────────────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === "," && !inQuotes) { result.push(current); current = ""; }
    else { current += char; }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: CsvRow = {};
    headers.forEach((h, i) => { row[h] = (values[i] ?? "").trim(); });
    return row;
  });
}

// ─── Drawing Canvas ───────────────────────────────────────────────────────────
// Stroke type (matches Liveblocks storage)
interface CanvasStroke {
  id: string;
  personKey: string;
  color: string;
  tool: string;
  pts: string; // JSON-encoded [{x,y}...]
}

interface DrawingCanvasProps { personColor: string; personLabel: string; }

function DrawingCanvas({ personColor, personLabel }: DrawingCanvasProps) {
  void React;
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentPtsRef = useRef<{ x: number; y: number }[]>([]);
  const lastPosRef   = useRef({ x: 0, y: 0 });
  const [tool, setTool] = useState<"pencil" | "eraser">("pencil");
  const toolRef = useRef<"pencil" | "eraser">("pencil");
  toolRef.current = tool;

  // All stored strokes for this person's panel
  type StoredStroke = { id: string; personKey: string; color: string; tool: string; pts: string };
  const allStrokes = (useStorage(root => root.retroCalendarStrokes) ?? []) as unknown as readonly StoredStroke[];
  const panelStrokes = allStrokes.filter(s => s.personKey === personLabel);

  const addStroke = useMutation(({ storage }, stroke: CanvasStroke) => {
    const list = storage.get("retroCalendarStrokes") as any;
    list.push(new LiveObject(stroke));
  }, []);

  const clearStrokes = useMutation(({ storage }) => {
    const list = storage.get("retroCalendarStrokes") as any;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list.get(i).get("personKey") === personLabel) list.delete(i);
    }
  }, [personLabel]);

  // ── helpers ──────────────────────────────────────────────────────────────
  const paintBackground = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#eeeeee";
    ctx.lineWidth = 0.5;
    for (let gy = 28; gy < h; gy += 28) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }
  };

  const replayStrokes = useCallback((ctx: CanvasRenderingContext2D, strokes: readonly StoredStroke[], inProgress?: { pts: { x: number; y: number }[]; tool: string }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    paintBackground(ctx, canvas.width, canvas.height);
    const renderStroke = (pts: { x: number; y: number }[], t: string, col: string) => {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.strokeStyle = t === "eraser" ? "#ffffff" : col;
      ctx.lineWidth   = t === "eraser" ? 18 : 2.5;
      ctx.lineCap     = "round";
      ctx.lineJoin    = "round";
      ctx.stroke();
    };
    strokes.forEach(s => {
      try { renderStroke(JSON.parse(s.pts), s.tool, s.color); } catch { /* ignore */ }
    });
    if (inProgress) renderStroke(inProgress.pts, inProgress.tool, personColor);
  }, [personColor]);

  // Re-render when remote strokes change
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    replayStrokes(ctx, panelStrokes, isDrawingRef.current ? { pts: currentPtsRef.current, tool: toolRef.current } : undefined);
  }, [panelStrokes, replayStrokes]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left)  / rect.width)  * CANVAS_W,
      y: ((e.clientY - rect.top)   / rect.height) * CANVAS_H,
    };
  };

  const drawSegmentLocal = (from: { x: number; y: number }, to: { x: number; y: number }, t: "pencil" | "eraser") => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = t === "eraser" ? "#ffffff" : personColor;
    ctx.lineWidth   = t === "eraser" ? 18 : 2.5;
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
  };

  const commitStroke = useCallback(() => {
    const pts = currentPtsRef.current;
    if (pts.length >= 2) {
      addStroke({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        personKey: personLabel,
        color: personColor,
        tool: toolRef.current,
        pts: JSON.stringify(pts),
      });
    }
    currentPtsRef.current = [];
    isDrawingRef.current = false;
  }, [addStroke, personLabel, personColor]);

  const handleClear = useCallback(() => {
    clearStrokes();
  }, [clearStrokes]);

  return (
    <div className="flex flex-col" style={{ width: COL_CANVAS, minWidth: COL_CANVAS }}>
      <div
        className="flex items-center justify-between px-1.5 py-1 shrink-0 border-b border-gray-200 bg-white sticky top-0 z-10"
        style={{ borderTop: `3px solid ${personColor}` }}
      >
        <span className="text-[11px] font-bold truncate max-w-[72px]" style={{ color: personColor }}>
          {personLabel}
        </span>
        <div className="flex gap-0.5 shrink-0">
          <button
            title="Pencil"
            className={`p-0.5 rounded transition-colors ${tool === "pencil" ? "bg-gray-200" : "hover:bg-gray-100"}`}
            onClick={() => setTool("pencil")}
          >
            <Pencil className="w-3 h-3" style={{ color: personColor }} />
          </button>
          <button
            title="Eraser"
            className={`p-0.5 rounded transition-colors ${tool === "eraser" ? "bg-gray-200" : "hover:bg-gray-100"}`}
            onClick={() => setTool("eraser")}
          >
            <Eraser className="w-3 h-3 text-gray-400" />
          </button>
          <button title="Clear" className="p-0.5 rounded hover:bg-red-50 transition-colors" onClick={handleClear}>
            <X className="w-3 h-3 text-gray-300" />
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ width: "100%", display: "block", cursor: tool === "eraser" ? "cell" : "crosshair" }}
        onMouseDown={(e) => {
          isDrawingRef.current = true;
          const pos = getPos(e);
          currentPtsRef.current = [pos];
          lastPosRef.current = pos;
        }}
        onMouseMove={(e) => {
          if (!isDrawingRef.current) return;
          const pos = getPos(e);
          drawSegmentLocal(lastPosRef.current, pos, toolRef.current);
          currentPtsRef.current.push(pos);
          lastPosRef.current = pos;
        }}
        onMouseUp={commitStroke}
        onMouseLeave={commitStroke}
      />
    </div>
  );
}

// ─── Draggable Image ──────────────────────────────────────────────────────────
interface DraggableImageProps {
  img: ImageData;
  onMove: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function DraggableImage({ img, onMove, onDelete, containerRef }: DraggableImageProps) {
  void React;
  const [isDragging, setIsDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    setIsDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const onMv = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const p = containerRef.current.getBoundingClientRect();
      onMove(img.id,
        Math.max(0, Math.min(90, ((ev.clientX - p.left  - offsetRef.current.x) / p.width ) * 100)),
        Math.max(0, Math.min(90, ((ev.clientY - p.top   - offsetRef.current.y) / p.height) * 100)),
      );
    };
    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMv);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMv);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      className="absolute group"
      style={{ left: `${img.x}%`, top: `${img.y}%`, width: img.width, height: img.height, cursor: isDragging ? "grabbing" : "grab", zIndex: isDragging ? 50 : 10 }}
      onMouseDown={handleMouseDown}
    >
      <img src={img.dataUrl} alt="" className="w-full h-full object-contain rounded shadow-md" />
      <button
        onClick={() => onDelete(img.id)}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Sticky Note (calendar right panels) ─────────────────────────────────────
interface CalStickyItemProps {
  note: CalSticky;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function CalStickyItem({ note, onUpdate, onDelete, onMove, containerRef }: CalStickyItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "TEXTAREA" || (e.target as HTMLElement).tagName === "BUTTON") return;
    e.preventDefault();
    setIsDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const onMv = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const p = containerRef.current.getBoundingClientRect();
      onMove(note.id,
        Math.max(0, Math.min(85, ((ev.clientX - p.left  - offsetRef.current.x) / p.width ) * 100)),
        Math.max(0, Math.min(85, ((ev.clientY - p.top   - offsetRef.current.y) / p.height) * 100)),
      );
    };
    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMv);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMv);
    window.addEventListener("mouseup", onUp);
  }, [note.id, onMove, containerRef]);

  return (
    <div
      className="absolute w-32 min-h-[8rem] p-2 shadow-md rounded-sm flex flex-col select-none"
      style={{ backgroundColor: note.color, left: `${note.x}%`, top: `${note.y}%`, cursor: isDragging ? "grabbing" : "grab", zIndex: isDragging ? 50 : 10 }}
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
        placeholder="Write here..."
        value={note.content}
        onChange={(e) => onUpdate(note.id, e.target.value)}
        rows={4}
      />
    </div>
  );
}

// ─── Right Panel ──────────────────────────────────────────────────────────────
interface RightPanelProps {
  section: { key: string; label: string };
  images: ImageData[];
  stickies: CalSticky[];
  selectedColor: string;
  onAddSticky: (zone: string, color: string, x: number, y: number) => void;
  onUpdateSticky: (id: string, content: string) => void;
  onDeleteSticky: (id: string) => void;
  onMoveSticky: (id: string, x: number, y: number) => void;
  onImagePaste: (e: React.ClipboardEvent, key: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, key: string) => void;
  onImageMove: (key: string, id: string, x: number, y: number) => void;
  onImageDelete: (key: string, id: string) => void;
}

function RightPanel({
  section, images, stickies, selectedColor,
  onAddSticky, onUpdateSticky, onDeleteSticky, onMoveSticky,
  onImagePaste, onImageUpload, onImageMove, onImageDelete,
}: RightPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const zone = `cal-${section.key}`;

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".cal-sticky,.image-item,button,label,input")) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    onAddSticky(zone, selectedColor,
      Math.max(0, Math.min(82, ((e.clientX - rect.left) / rect.width)  * 100)),
      Math.max(0, Math.min(82, ((e.clientY - rect.top)  / rect.height) * 100)),
    );
  };

  return (
    <div className="flex flex-col border-r border-gray-200 last:border-r-0" style={{ minWidth: 270, flex: "1 1 0" }}>
      <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 border-b border-indigo-200 shrink-0 sticky top-0 z-10">
        <span className="font-semibold text-indigo-700 text-sm">{section.label}</span>
        <label className="flex items-center gap-1 text-xs text-indigo-400 cursor-pointer hover:text-indigo-600 transition">
          <Upload className="w-3 h-3" />
          <span>Image</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onImageUpload(e, section.key)} />
        </label>
      </div>
      <div
        ref={containerRef}
        className="relative flex-1 bg-white cursor-crosshair overflow-hidden"
        style={{ minHeight: 400 }}
        onClick={handleClick}
        onPaste={(e) => onImagePaste(e, section.key)}
      >
        <p className="absolute inset-0 flex flex-col items-center justify-center text-gray-200 text-xs pointer-events-none select-none text-center px-4 gap-1">
          <span>Click to add sticky</span>
          <span>Paste / upload images</span>
        </p>
        {images.map(img => (
          <div key={img.id} className="image-item">
            <DraggableImage img={img} containerRef={containerRef as React.RefObject<HTMLDivElement>}
              onMove={(id, x, y) => onImageMove(section.key, id, x, y)}
              onDelete={(id) => onImageDelete(section.key, id)} />
          </div>
        ))}
        {stickies.map(note => (
          <div key={note.id} className="cal-sticky">
            <CalStickyItem note={note} onUpdate={onUpdateSticky} onDelete={onDeleteSticky} onMove={onMoveSticky}
              containerRef={containerRef as React.RefObject<HTMLDivElement>} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function ReleaseCalendarArea() {
  const [csvRows,       setCsvRows]      = useState<CsvRow[]>([]);
  const [columnWidths,  setColumnWidths] = useState<Record<string, number>>(() => {
    const w: Record<string, number> = {};
    JIRA_COLUMNS.forEach(c => { w[c.key] = c.defaultWidth; });
    return w;
  });
  const [sectionImages, setSectionImages] = useState<SectionImages>({});
  const [selectedColor, setSelectedColor] = useState(STICKY_COLORS[0]);

  const self = useSelf();
  const userName: string = (self?.presence?.name as string | undefined) ?? "Anonymous";

  const allStickies = (useStorage(root => root.retroStickies) ?? []) as unknown as CalSticky[];
  const calStickies = allStickies.filter((s: CalSticky) =>
    RIGHT_SECTIONS.some(sec => `cal-${sec.key}` === s.zone)
  );

  // Auto-load default CSV served from public/
  useEffect(() => {
    fetch("/Jira.csv")
      .then(r => r.ok ? r.text() : Promise.reject(new Error("not found")))
      .then(text => setCsvRows(parseCSV(text)))
      .catch(() => {});
  }, []);

  // ── Liveblocks mutations ──────────────────────────────────────────────────
  const addSticky = useMutation(({ storage }, zone: string, color: string, x: number, y: number) => {
    const list = storage.get("retroStickies") as any;
    list.push(new LiveObject({ id: Date.now().toString() + Math.random().toString(36).slice(2), content: "", x, y, color, userName, zone }));
  }, [userName]);

  const updateSticky = useMutation(({ storage }, id: string, content: string) => {
    const list = storage.get("retroStickies") as any;
    const i = list.findIndex((s: any) => s.get("id") === id);
    if (i !== -1) list.get(i).set("content", content);
  }, []);

  const deleteSticky = useMutation(({ storage }, id: string) => {
    const list = storage.get("retroStickies") as any;
    const i = list.findIndex((s: any) => s.get("id") === id);
    if (i !== -1) list.delete(i);
  }, []);

  const moveSticky = useMutation(({ storage }, id: string, x: number, y: number) => {
    const list = storage.get("retroStickies") as any;
    const i = list.findIndex((s: any) => s.get("id") === id);
    if (i !== -1) { list.get(i).set("x", x); list.get(i).set("y", y); }
  }, []);

  // ── CSV import ────────────────────────────────────────────────────────────
  const handleCSVImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCsvRows(parseCSV(ev.target?.result as string));
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  // ── Column resize — key/startWidth captured in closure to prevent crash ──
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, key: string) => {
    e.preventDefault();
    const startX     = e.clientX;
    const startWidth = columnWidths[key] ?? 80;
    const onMv = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      setColumnWidths(prev => ({ ...prev, [key]: Math.max(40, startWidth + delta) }));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMv);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMv);
    window.addEventListener("mouseup", onUp);
  };

  // ── Image handlers ────────────────────────────────────────────────────────
  const handleImagePaste = useCallback((e: React.ClipboardEvent, sectionKey: string) => {
    Array.from(e.clipboardData.items).forEach(item => {
      if (!item.type.startsWith("image/")) return;
      const blob = item.getAsFile(); if (!blob) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string;
        setSectionImages(prev => ({ ...prev, [sectionKey]: [...(prev[sectionKey] ?? []), { id: Date.now() + "" + Math.random(), dataUrl, x: 5, y: 5, width: 200, height: 150 }] }));
      };
      reader.readAsDataURL(blob);
    });
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, sectionKey: string) => {
    Array.from(e.target.files ?? []).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string;
        setSectionImages(prev => ({ ...prev, [sectionKey]: [...(prev[sectionKey] ?? []), { id: Date.now() + "" + Math.random(), dataUrl, x: 5, y: 5, width: 200, height: 150 }] }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }, []);

  const handleImageMove   = (k: string, id: string, x: number, y: number) =>
    setSectionImages(prev => ({ ...prev, [k]: (prev[k] ?? []).map(img => img.id === id ? { ...img, x, y } : img) }));
  const handleImageDelete = (k: string, id: string) =>
    setSectionImages(prev => ({ ...prev, [k]: (prev[k] ?? []).filter(img => img.id !== id) }));

  return (
    <div className="border-2 border-gray-400 rounded-xl bg-white shadow-lg overflow-hidden">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-indigo-700 text-white px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold tracking-wide">Release Calendar</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium opacity-80">Sticky:</span>
            {STICKY_COLORS.map(c => (
              <button key={c}
                className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                style={{ backgroundColor: c, borderColor: selectedColor === c ? "white" : "transparent", transform: selectedColor === c ? "scale(1.25)" : undefined }}
                onClick={() => setSelectedColor(c)} title={c}
              />
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer bg-white/20 hover:bg-white/30 transition px-3 py-1.5 rounded-lg text-sm font-medium">
            <Upload className="w-4 h-4" />
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
          </label>
        </div>
      </div>

      {/* ── Horizontal scroll ─────────────────────────────────────────────── */}
      <div className="flex overflow-x-auto">

        {/* 1 — Jira table */}
        <div className="shrink-0 border-r-2 border-gray-300">
          <table className="border-collapse" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr>
                {JIRA_COLUMNS.map(col => (
                  <th key={col.key}
                    className="relative text-xs font-bold text-white bg-indigo-500 border border-indigo-300 px-2 py-2 text-left select-none"
                    style={{ width: columnWidths[col.key], minWidth: columnWidths[col.key] }}
                  >
                    <span className="block truncate pr-4">{col.label}</span>
                    <div
                      className="absolute top-0 right-0 h-full w-3 cursor-col-resize hover:bg-white/30 flex items-center justify-center"
                      onMouseDown={e => handleResizeStart(e, col.key)}
                    >
                      <GripVertical className="w-3 h-3 text-white/50 pointer-events-none" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvRows.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-indigo-50"}>
                  {JIRA_COLUMNS.map(col => (
                    <td key={col.key}
                      className="text-xs border border-gray-200 px-2 py-1.5 overflow-hidden"
                      style={{ width: columnWidths[col.key], maxWidth: columnWidths[col.key] }}
                    >
                      <div className="truncate" title={row[col.key] ?? ""}>{row[col.key] ?? ""}</div>
                    </td>
                  ))}
                </tr>
              ))}
              {csvRows.length === 0 && (
                <tr>
                  <td colSpan={JIRA_COLUMNS.length} className="text-center py-12 text-gray-400 text-xs italic">
                    Loading Jira data…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 2 — Per-person drawing canvases */}
        <div className="flex shrink-0 border-r-2 border-gray-300">
          {PERSON_COLUMNS.map(person => (
            <div key={person.key} className="border-r border-gray-200 last:border-r-0">
              <DrawingCanvas personColor={person.color} personLabel={person.key} />
            </div>
          ))}
        </div>

        {/* 3 — Highs | Lows | Animal Magic | Musical Vibes */}
        <div className="flex shrink-0 self-stretch">
          {RIGHT_SECTIONS.map(section => (
            <RightPanel
              key={section.key}
              section={section}
              images={sectionImages[section.key] ?? []}
              stickies={calStickies.filter(s => s.zone === `cal-${section.key}`)}
              selectedColor={selectedColor}
              onAddSticky={addSticky}
              onUpdateSticky={updateSticky}
              onDeleteSticky={deleteSticky}
              onMoveSticky={moveSticky}
              onImagePaste={handleImagePaste}
              onImageUpload={handleImageUpload}
              onImageMove={handleImageMove}
              onImageDelete={handleImageDelete}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
