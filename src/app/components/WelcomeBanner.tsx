import { Info, X } from "lucide-react";
import { useState, useEffect } from "react";

export function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show banner only if it hasn't been dismissed before
    const dismissed = localStorage.getItem("welcomeBannerDismissed");
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("welcomeBannerDismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full mx-4">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-2xl p-4 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-start gap-3 pr-8">
          <Info className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-lg mb-1">Welcome to Collaborative Board! 🎉</h3>
            <p className="text-sm text-white/90">
              This board supports real-time collaboration! Click the{" "}
              <strong>"Share Link"</strong> button in the top-right to invite others.
              Everyone who joins will see live cursors and can interact together.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
