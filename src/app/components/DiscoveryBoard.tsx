import { useState } from "react";
import { Plus } from "lucide-react";
import { StickyNote } from "@/app/components/StickyNote";
import { useStorage, useMutation, useSelf } from "@liveblocks/react/suspense";
import { LiveObject, LiveList } from "@liveblocks/client";

const COLORS = ["#fef08a", "#bfdbfe", "#fbbf24", "#a7f3d0", "#fca5a5", "#e9d5ff", "#fed7aa"];

type StickyType = LiveObject<{
  id: string;
  content: string;
  x: number;
  y: number;
  color: string;
  userName: string;
}>;

export function DiscoveryBoard() {
  const stickies = useStorage((root) => root.stickies) || [];
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const self = useSelf();
  const userName = (self?.presence?.name as string | undefined) || "Anonymous";

  const addSticky = useMutation(({ storage }) => {
    const newSticky = new LiveObject({
      id: Date.now().toString(),
      content: "",
      x: Math.random() * 60 + 10,
      y: Math.random() * 60 + 10,
      color: selectedColor,
      userName: userName,
    });
    
    const stickiesList = storage.get("stickies") as unknown as LiveList<StickyType>;
    stickiesList.push(newSticky);
  }, [selectedColor, userName]);

  const updateSticky = useMutation(({ storage }, id: string, content: string) => {
    const stickiesList = storage.get("stickies") as unknown as LiveList<StickyType>;
    const index = stickiesList.findIndex((s) => s.get("id") === id);
    if (index !== -1) {
      stickiesList.get(index)?.set("content", content);
    }
  }, []);

  const deleteSticky = useMutation(({ storage }, id: string) => {
    const stickiesList = storage.get("stickies") as unknown as LiveList<StickyType>;
    const index = stickiesList.findIndex((s) => s.get("id") === id);
    if (index !== -1) {
      stickiesList.delete(index);
    }
  }, []);

  const moveSticky = useMutation(({ storage }, id: string, x: number, y: number) => {
    const stickiesList = storage.get("stickies") as unknown as LiveList<StickyType>;
    const index = stickiesList.findIndex((s) => s.get("id") === id);
    if (index !== -1) {
      const sticky = stickiesList.get(index);
      sticky?.set("x", x);
      sticky?.set("y", y);
    }
  }, []);

  return (
    <div className="size-full p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Discovery Phase</h2>
          <p className="text-sm text-gray-600 mt-1">Share your current workflow grievances</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedColor === color ? 'border-blue-600 scale-110' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title="Select color"
              />
            ))}
          </div>
          <button
            onClick={addSticky}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Add Sticky
          </button>
        </div>
      </div>
      <div 
        className="relative w-full h-[calc(100%-5rem)] border-2 border-dashed border-blue-300 rounded-lg bg-white/50 overflow-hidden"
        id="discovery-board"
      >
        {Array.isArray(stickies) && stickies.map((sticky: any) => (
          <StickyNote
            key={sticky.id}
            id={sticky.id}
            content={sticky.content}
            x={sticky.x}
            y={sticky.y}
            color={sticky.color}
            userName={sticky.userName}
            onUpdate={updateSticky}
            onDelete={deleteSticky}
            onMove={moveSticky}
          />
        ))}
      </div>
    </div>
  );
}