import { useState } from "react";
import { Plus, ArrowRight, X } from "lucide-react";
import { useStorage, useMutation } from "@liveblocks/react/suspense";
import { LiveObject, LiveList } from "@liveblocks/client";

interface Step {
  id: string;
  text: string;
}

interface Row {
  id: number;
  name: string;
  steps: Step[];
}

export function PreDiscoveryPhase() {
  const rows = useStorage((root) => root.preDiscoveryRows) || [];

  const addStep = useMutation(({ storage }, rowId: number) => {
    const rowsList = storage.get("preDiscoveryRows") as unknown as LiveList<any>;
    const index = rowsList.findIndex((r: any) => r.get("id") === rowId);
    if (index !== -1) {
      const row = rowsList.get(index);
      const steps = row?.get("steps") as unknown as LiveList<any>;
      const newStep = new LiveObject({
        id: `${rowId}-${steps.length + 1}`,
        text: "",
      });
      steps.push(newStep);
    }
  }, []);

  const deleteStep = useMutation(({ storage }, rowId: number, stepId: string) => {
    const rowsList = storage.get("preDiscoveryRows") as unknown as LiveList<any>;
    const rowIndex = rowsList.findIndex((r: any) => r.get("id") === rowId);
    if (rowIndex !== -1) {
      const row = rowsList.get(rowIndex);
      const steps = row?.get("steps") as unknown as LiveList<any>;
      const stepIndex = steps.findIndex((s: any) => s.get("id") === stepId);
      if (stepIndex !== -1 && steps.length > 1) {
        steps.delete(stepIndex);
      }
    }
  }, []);

  const updateRowName = useMutation(({ storage }, rowId: number, name: string) => {
    const rowsList = storage.get("preDiscoveryRows") as unknown as LiveList<any>;
    const index = rowsList.findIndex((r: any) => r.get("id") === rowId);
    if (index !== -1) {
      rowsList.get(index)?.set("name", name);
    }
  }, []);

  const updateStep = useMutation(({ storage }, rowId: number, stepId: string, text: string) => {
    const rowsList = storage.get("preDiscoveryRows") as unknown as LiveList<any>;
    const rowIndex = rowsList.findIndex((r: any) => r.get("id") === rowId);
    if (rowIndex !== -1) {
      const row = rowsList.get(rowIndex);
      const steps = row?.get("steps") as unknown as LiveList<any>;
      const stepIndex = steps.findIndex((s: any) => s.get("id") === stepId);
      if (stepIndex !== -1) {
        steps.get(stepIndex)?.set("text", text);
      }
    }
  }, []);

  return (
    <div className="size-full p-4 bg-gradient-to-br from-purple-50 to-pink-50 overflow-auto">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Pre-Discovery Phase</h2>
        <p className="text-sm text-gray-600 mt-1">Describe your dream workflow process</p>
      </div>
      
      <div className="space-y-3">
        {Array.isArray(rows) && rows.map((row: any) => (
          <div key={row.id} className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <input
                type="text"
                value={row.name}
                onChange={(e) => updateRowName(row.id, e.target.value)}
                placeholder={`Row ${row.id}`}
                className="w-32 px-3 py-2 border-2 border-purple-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>
            
            <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2">
              {Array.isArray(row.steps) && row.steps.map((step: any, index: number) => (
                <div key={step.id} className="flex items-center gap-2 flex-shrink-0">
                  <div className="relative group">
                    <input
                      type="text"
                      value={step.text}
                      onChange={(e) => updateStep(row.id, step.id, e.target.value)}
                      placeholder={`Step ${index + 1}`}
                      className="w-40 px-3 py-2 pr-8 border-2 border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                    {row.steps.length > 1 && (
                      <button
                        onClick={() => deleteStep(row.id, step.id)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="Delete step"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {index < row.steps.length - 1 && (
                    <ArrowRight className="text-purple-400" size={20} />
                  )}
                </div>
              ))}
              
              <button
                onClick={() => addStep(row.id)}
                className="flex-shrink-0 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                title="Add step"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}