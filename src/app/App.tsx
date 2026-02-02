import { DiscoveryBoard } from "@/app/components/DiscoveryBoard";
import { GatheringPhase } from "@/app/components/GatheringPhase";
import { PreDiscoveryPhase } from "@/app/components/PreDiscoveryPhase";
import { CollaborationHeader } from "@/app/components/CollaborationHeader";
import { WelcomeBanner } from "@/app/components/WelcomeBanner";
import { Cursors } from "@/app/components/Cursors";
import { UserNamePrompt } from "@/app/components/UserNamePrompt";
import { WorkflowStages } from "@/app/components/WorkflowStages";

export default function App() {
  return (
    <div className="size-full flex flex-col bg-gray-100 overflow-y-auto overflow-x-hidden">
      <UserNamePrompt />
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
            <h1 className="text-2xl font-bold text-white">Mitigating Delays</h1>
          </div>

          {/* Workflow Stages Section */}
          <WorkflowStages />

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