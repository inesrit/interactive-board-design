import { useState } from "react";
import { Plus, ThumbsUp, ThumbsDown, CheckCircle, X } from "lucide-react";
import { useStorage, useMutation } from "@liveblocks/react/suspense";
import { LiveObject, LiveList } from "@liveblocks/client";

export function GatheringPhase() {
  const ideas = useStorage((root) => root.ideas) || [];
  const actions = useStorage((root) => root.actions) || [];
  const [newIdeaText, setNewIdeaText] = useState("");
  const [newActionText, setNewActionText] = useState("");
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);

  const addIdea = useMutation(({ storage }) => {
    if (newIdeaText.trim()) {
      const newIdea = new LiveObject({
        id: Date.now().toString(),
        text: newIdeaText,
        agree: 0,
        disagree: 0,
      });
      const ideasList = storage.get("ideas") as unknown as LiveList<any>;
      ideasList.push(newIdea);
      setNewIdeaText("");
    }
  }, [newIdeaText]);

  const rateIdea = useMutation(({ storage }, id: string, type: 'agree' | 'disagree') => {
    const ideasList = storage.get("ideas") as unknown as LiveList<any>;
    const index = ideasList.findIndex((idea: any) => idea.get("id") === id);
    if (index !== -1) {
      const idea = ideasList.get(index);
      const currentValue = idea?.get(type) || 0;
      idea?.set(type, currentValue + 1);
    }
  }, []);

  const deleteIdea = useMutation(({ storage }, id: string) => {
    const ideasList = storage.get("ideas") as unknown as LiveList<any>;
    const index = ideasList.findIndex((idea: any) => idea.get("id") === id);
    if (index !== -1) {
      ideasList.delete(index);
    }
    if (selectedIdea === id) {
      setSelectedIdea(null);
    }
  }, [selectedIdea]);

  const addAction = useMutation(({ storage }) => {
    if (newActionText.trim()) {
      const newAction = new LiveObject({
        id: Date.now().toString(),
        text: newActionText,
        completed: false,
      });
      const actionsList = storage.get("actions") as unknown as LiveList<any>;
      actionsList.push(newAction);
      setNewActionText("");
    }
  }, [newActionText]);

  const toggleAction = useMutation(({ storage }, id: string) => {
    const actionsList = storage.get("actions") as unknown as LiveList<any>;
    const index = actionsList.findIndex((action: any) => action.get("id") === id);
    if (index !== -1) {
      const action = actionsList.get(index);
      action?.set("completed", !action.get("completed"));
    }
  }, []);

  const deleteAction = useMutation(({ storage }, id: string) => {
    const actionsList = storage.get("actions") as unknown as LiveList<any>;
    const index = actionsList.findIndex((action: any) => action.get("id") === id);
    if (index !== -1) {
      actionsList.delete(index);
    }
  }, []);

  return (
    <div className="size-full p-4 bg-gray-50">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Gathering Phase</h2>
        <p className="text-sm text-gray-600 mt-1">Share your ideas on how to improve our workflow process</p>
      </div>
      <div className="grid grid-cols-3 gap-4 h-[calc(100%-4rem)]">
        {/* Left - Ideas */}
        <div className="bg-white rounded-lg border-2 border-green-300 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Ideas</h3>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{Array.isArray(ideas) ? ideas.length : 0}</span>
          </div>
          
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newIdeaText}
              onChange={(e) => setNewIdeaText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addIdea()}
              placeholder="Enter an idea..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={addIdea}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {Array.isArray(ideas) && ideas.map((idea: any) => (
              <div
                key={idea.id}
                className={`relative p-3 border-2 rounded-lg cursor-pointer transition-all group ${
                  selectedIdea === idea.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div onClick={() => setSelectedIdea(idea.id)}>
                  <p className="text-sm text-gray-800 pr-6">{idea.text}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={12} className="text-green-600" />
                      {idea.agree}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsDown size={12} className="text-red-600" />
                      {idea.disagree}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteIdea(idea.id);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X size={14} className="text-red-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Middle - Agree/Disagree Rating */}
        <div className="bg-white rounded-lg border-2 border-purple-300 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Rate Ideas</h3>
            <span className="text-xs text-gray-500">Agree / Disagree</span>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {selectedIdea ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-full max-w-md p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <p className="text-center mb-6 text-gray-800">
                    {Array.isArray(ideas) && ideas.find((i: any) => i.id === selectedIdea)?.text}
                  </p>
                  
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => rateIdea(selectedIdea, 'agree')}
                      className="flex flex-col items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <ThumbsUp size={32} />
                      <span className="font-semibold">Agree</span>
                      <span className="text-2xl font-bold">
                        {Array.isArray(ideas) && (ideas.find((i: any) => i.id === selectedIdea) as any)?.agree || 0}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => rateIdea(selectedIdea, 'disagree')}
                      className="flex flex-col items-center gap-2 px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <ThumbsDown size={32} />
                      <span className="font-semibold">Disagree</span>
                      <span className="text-2xl font-bold">
                        {Array.isArray(ideas) && (ideas.find((i: any) => i.id === selectedIdea) as any)?.disagree || 0}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-gray-500">
                <div>
                  <p className="mb-2">Select an idea from the left</p>
                  <p className="text-sm">to rate it here</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right - Actions */}
        <div className="bg-white rounded-lg border-2 border-orange-300 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Actions</h3>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">{Array.isArray(actions) ? actions.length : 0}</span>
          </div>
          
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newActionText}
              onChange={(e) => setNewActionText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addAction()}
              placeholder="Enter an action..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={addAction}
              className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {Array.isArray(actions) && actions.map((action: any) => (
              <div
                key={action.id}
                className={`relative p-3 border-2 rounded-lg cursor-pointer transition-all group ${
                  action.completed
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div onClick={() => toggleAction(action.id)} className="flex items-start gap-2">
                  <CheckCircle
                    size={18}
                    className={`flex-shrink-0 mt-0.5 ${
                      action.completed ? 'text-green-600 fill-green-600' : 'text-gray-400'
                    }`}
                  />
                  <p className={`text-sm flex-1 pr-6 ${
                    action.completed ? 'text-gray-500 line-through' : 'text-gray-800'
                  }`}>
                    {action.text}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAction(action.id);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X size={14} className="text-red-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}