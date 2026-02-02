import { useOthers, useSelf } from "@liveblocks/react/suspense";
import { Users, Copy, Check } from "lucide-react";
import { useState } from "react";

export function CollaborationHeader() {
  const others = useOthers();
  const self = useSelf();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const totalUsers = others.length + 1; // others + self

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
      {/* Active Users Count */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg border border-gray-200">
        <Users className="w-5 h-5 text-indigo-600" />
        <span className="font-semibold text-gray-700">
          {totalUsers} {totalUsers === 1 ? "User" : "Users"} Active
        </span>
      </div>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-5 h-5" />
            <span className="font-medium">Link Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-5 h-5" />
            <span className="font-medium">Share Link</span>
          </>
        )}
      </button>
    </div>
  );
}
