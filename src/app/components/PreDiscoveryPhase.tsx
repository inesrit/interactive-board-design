import { useState } from "react";
import { ArrowRight, Plus, X } from "lucide-react";
import { useStorage, useMutation } from "@liveblocks/react/suspense";
import { LiveList, LiveObject } from "@liveblocks/client";

export function PreDiscoveryPhase() {
  const boxes = useStorage((root) => root.preDiscoveryBoxes) || [];
  const order = useStorage((root) => root.preDiscoveryOrder) || [];
  const [draggedBoxId, setDraggedBoxId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [newBoxText, setNewBoxText] = useState("");

  const addBox = useMutation(({ storage }, text: string) => {
    if (text.trim()) {
      const boxesList = storage.get("preDiscoveryBoxes") as unknown as LiveList<any>;
      const newBox = new LiveObject({
        id: `box-${Date.now()}`,
        text: text.trim(),
      });
      boxesList.push(newBox);
      setNewBoxText("");
    }
  }, []);

  const deleteBox = useMutation(({ storage }, boxId: string) => {
    const boxesList = storage.get("preDiscoveryBoxes") as unknown as LiveList<any>;
    const index = boxesList.findIndex((b: any) => b.get("id") === boxId);
    if (index !== -1) {
      boxesList.delete(index);
    }
    // Also remove from order if it exists there
    const orderList = storage.get("preDiscoveryOrder") as unknown as LiveList<string>;
    const orderIndex = orderList.toArray().indexOf(boxId);
    if (orderIndex !== -1) {
      orderList.delete(orderIndex);
    }
  }, []);

  const addToOrder = useMutation(({ storage }, boxId: string) => {
    const orderList = storage.get("preDiscoveryOrder") as unknown as LiveList<string>;
    if (!orderList.toArray().includes(boxId)) {
      orderList.push(boxId);
    }
  }, []);

  const removeFromOrder = useMutation(({ storage }, boxId: string) => {
    const orderList = storage.get("preDiscoveryOrder") as unknown as LiveList<string>;
    const index = orderList.toArray().indexOf(boxId);
    if (index !== -1) {
      orderList.delete(index);
    }
  }, []);

  const reorderBoxes = useMutation(({ storage }, fromIndex: number, toIndex: number) => {
    const orderList = storage.get("preDiscoveryOrder") as unknown as LiveList<string>;
    const orderArray = orderList.toArray();
    const [removed] = orderArray.splice(fromIndex, 1);
    orderArray.splice(toIndex, 0, removed);
    
    // Clear and rebuild
    while (orderList.length > 0) {
      orderList.delete(0);
    }
    orderArray.forEach(id => orderList.push(id));
  }, []);

  const insertAtPosition = useMutation(({ storage }, boxId: string, position: number) => {
    const orderList = storage.get("preDiscoveryOrder") as unknown as LiveList<string>;
    const orderArray = orderList.toArray();
    
    // Remove if already exists
    const existingIndex = orderArray.indexOf(boxId);
    if (existingIndex !== -1) {
      orderArray.splice(existingIndex, 1);
      if (existingIndex < position) position--;
    }
    
    orderArray.splice(position, 0, boxId);
    
    // Clear and rebuild
    while (orderList.length > 0) {
      orderList.delete(0);
    }
    orderArray.forEach(id => orderList.push(id));
  }, []);

  const handleDragStart = (boxId: string, e: React.DragEvent) => {
    setDraggedBoxId(boxId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedBoxId(null);
    setDragOverIndex(null);
  };

  const handleDropOnPlaceholder = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedBoxId) {
      const orderArray = Array.isArray(order) ? (order as string[]) : [];
      if (dragOverIndex !== null) {
        insertAtPosition(draggedBoxId, dragOverIndex);
      } else if (!orderArray.includes(draggedBoxId)) {
        addToOrder(draggedBoxId);
      }
    }
  };

  const handleDragOverPlaceholder = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (index !== undefined) {
      setDragOverIndex(index);
    }
  };

  const getBoxById = (boxId: string) => {
    return Array.isArray(boxes) ? boxes.find((b: any) => b.id === boxId) : null;
  };

  const orderedBoxes = Array.isArray(order) ? (order as string[]).map(getBoxById).filter(Boolean) : [];
  const unorderedBoxes = Array.isArray(boxes) ? boxes.filter((b: any) => !(order as string[]).includes(b.id)) : [];

  return (
    <div className="size-full p-4 bg-gradient-to-br from-purple-50 to-pink-50 overflow-auto">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Pre-Discovery Phase</h2>
        <p className="text-sm text-gray-600 mt-1">Add ideas below, then drag to order them</p>
      </div>
      
      {/* Add Box Input */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={newBoxText}
          onChange={(e) => setNewBoxText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addBox(newBoxText)}
          placeholder="Type your idea and press Enter or click Add..."
          className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
        />
        <button
          onClick={() => addBox(newBoxText)}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus size={18} />
          Add
        </button>
      </div>

      {/* Available Boxes */}
      {unorderedBoxes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Available Ideas (drag to order below):</h3>
          <div className="grid grid-cols-5 gap-3">
            {unorderedBoxes.map((box: any) => (
              <div
                key={box.id}
                draggable
                onDragStart={(e) => handleDragStart(box.id, e)}
                onDragEnd={handleDragEnd}
                className={`relative group cursor-grab active:cursor-grabbing ${
                  draggedBoxId === box.id ? "opacity-50" : ""
                }`}
              >
                <div className="w-full p-3 bg-white border-2 border-purple-300 rounded-lg">
                  <p className="text-sm text-gray-800">{box.text}</p>
                </div>
                <button
                  onClick={() => deleteBox(box.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center"
                  title="Delete idea"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ordering Area */}
      <div className="border-t-2 border-purple-300 pt-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Drag boxes here to order your workflow</h3>
        <div
          onDrop={handleDropOnPlaceholder}
          onDragOver={(e) => handleDragOverPlaceholder(e)}
          className="min-h-32 p-4 border-2 border-dashed border-purple-400 rounded-lg bg-white/50 flex flex-wrap items-center gap-3"
        >
          {orderedBoxes.length === 0 ? (
            <p className="text-gray-400 text-sm">Drop boxes here to create your ordered workflow</p>
          ) : (
            orderedBoxes.map((box: any, index: number) => (
              <div key={box.id} className="flex items-center gap-3 flex-shrink-0">
                {/* Drop zone before box */}
                <div
                  onDrop={handleDropOnPlaceholder}
                  onDragOver={(e) => handleDragOverPlaceholder(e, index)}
                  className={`w-2 h-20 rounded transition-colors ${
                    dragOverIndex === index && draggedBoxId !== box.id
                      ? "bg-purple-500"
                      : "bg-transparent hover:bg-purple-200"
                  }`}
                />
                
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(box.id, e)}
                  onDragEnd={handleDragEnd}
                  className={`relative group cursor-grab active:cursor-grabbing ${
                    draggedBoxId === box.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="w-48 p-3 bg-purple-100 border-2 border-purple-400 rounded-lg">
                    <p className="text-sm text-gray-800">{box.text || "Empty"}</p>
                  </div>
                  <button
                    onClick={() => removeFromOrder(box.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
                
                {index < orderedBoxes.length - 1 && (
                  <ArrowRight className="text-purple-400 flex-shrink-0" size={24} />
                )}
                
                {/* Drop zone after last box */}
                {index === orderedBoxes.length - 1 && (
                  <div
                    onDrop={handleDropOnPlaceholder}
                    onDragOver={(e) => handleDragOverPlaceholder(e, index + 1)}
                    className={`w-2 h-20 rounded transition-colors ${
                      dragOverIndex === index + 1
                        ? "bg-purple-500"
                        : "bg-transparent hover:bg-purple-200"
                    }`}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}