import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface StickyNoteProps {
  id: string;
  content: string;
  x: number;
  y: number;
  color: string;
  userName: string;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
}

export function StickyNote({ id, content, x, y, color, userName, onUpdate, onDelete, onMove }: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const noteRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'BUTTON') {
      return;
    }
    
    setIsDragging(true);
    const rect = noteRef.current?.getBoundingClientRect();
    const parent = noteRef.current?.parentElement?.getBoundingClientRect();
    
    if (rect && parent) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !noteRef.current) return;
    
    const parent = noteRef.current.parentElement?.getBoundingClientRect();
    if (!parent) return;

    const newX = ((e.clientX - parent.left - dragOffset.x) / parent.width) * 100;
    const newY = ((e.clientY - parent.top - dragOffset.y) / parent.height) * 100;

    // Clamp values between 0 and 90 to keep within bounds
    onMove(id, Math.max(0, Math.min(90, newX)), Math.max(0, Math.min(90, newY)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      ref={noteRef}
      className="absolute w-48 h-48 p-3 shadow-lg cursor-move rounded-sm flex flex-col"
      style={{
        backgroundColor: color,
        left: `${x}%`,
        top: `${y}%`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      <button
        onClick={() => onDelete(id)}
        className="absolute top-1 right-1 p-1 rounded-full hover:bg-black/10 transition-colors"
      >
        <X size={14} />
      </button>
      <textarea
        value={content}
        onChange={(e) => onUpdate(id, e.target.value)}
        placeholder="Type here..."
        className="flex-1 w-full bg-transparent border-none outline-none resize-none text-sm placeholder:text-gray-500"
        style={{ cursor: 'text' }}
      />
      <div className="mt-auto pt-2 border-t border-black/10">
        <p className="text-xs font-medium text-gray-700">— {userName}</p>
      </div>
    </div>
  );
}