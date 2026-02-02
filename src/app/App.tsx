import { DiscoveryBoard } from "@/app/components/DiscoveryBoard";
import { GatheringPhase } from "@/app/components/GatheringPhase";
import { PreDiscoveryPhase } from "@/app/components/PreDiscoveryPhase";
import { CollaborationHeader } from "@/app/components/CollaborationHeader";
import { WelcomeBanner } from "@/app/components/WelcomeBanner";
import { Cursors } from "@/app/components/Cursors";

export default function App() {
  return (
    <div className="size-full flex flex-col bg-gray-100 overflow-y-auto overflow-x-hidden">
      <Cursors />
      <CollaborationHeader />
      <WelcomeBanner />
      {/* Scrollable Container with fixed zoom */}
      <div className="min-h-full flex justify-center py-8">
        <div
          className="w-[2000px] flex flex-col bg-gray-50 shadow-2xl"
          style={{
            transform: "scale(0.85)",
            transformOrigin: "top center",
            pointerEvents: "auto",
          }}
        >
          {/* Title Section */}
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 border-b-4 border-indigo-700" style={{ pointerEvents: "auto" }}>
            <h1 className="text-2xl font-bold text-white mb-3">
              Mitigating Delays
            </h1>
            <div className="flex flex-wrap gap-2">
              <span className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium shadow-md">
                Refinement
              </span>
              <span className="px-4 py-2 bg-emerald-500 text-white rounded-full text-sm font-medium shadow-md">
                Investigation
              </span>
              <span className="px-4 py-2 bg-amber-500 text-white rounded-full text-sm font-medium shadow-md">
                KickOff
              </span>
              <span className="px-4 py-2 bg-rose-500 text-white rounded-full text-sm font-medium shadow-md">
                PR Reviews
              </span>
              <span className="px-4 py-2 bg-purple-500 text-white rounded-full text-sm font-medium shadow-md">
                UX Reviews
              </span>
              <span className="px-4 py-2 bg-cyan-500 text-white rounded-full text-sm font-medium shadow-md">
                Technical Reviews
              </span>
              <span className="px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium shadow-md">
                Manual Testing
              </span>
            </div>
          </div>

          {/* Pre-Discovery Phase - Top Section */}
          <div className="min-h-[400px] border-b-4 border-gray-300">
            <PreDiscoveryPhase />
          </div>

          {/* Discovery Phase - Middle Section */}
          <div className="min-h-[600px] border-b-4 border-gray-300">
            <DiscoveryBoard />
          </div>

          {/* Gathering Phase - Bottom Section with 3 columns */}
          <div className="min-h-[600px]">
            <GatheringPhase />
          </div>
        </div>
      </div>
    </div>
  );
}