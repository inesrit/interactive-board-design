import { useState } from "react";
import { useUpdateMyPresence, useSelf } from "@liveblocks/react/suspense";

export function UserNamePrompt() {
  const updateMyPresence = useUpdateMyPresence();
  const self = useSelf();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasName = self?.presence?.name;

  if (hasName) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isSubmitting) {
      setIsSubmitting(true);
      updateMyPresence({ name: name.trim() });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to the Collaboration Room
        </h2>
        <p className="text-gray-600 mb-6">
          Please enter your name to join the session
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-lg mb-4"
            autoFocus
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isSubmitting ? "Joining..." : "Join Room"}
          </button>
        </form>
      </div>
    </div>
  );
}
