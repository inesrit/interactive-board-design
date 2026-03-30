import { Cursors } from "@/app/components/Cursors";
import { CollaborationHeader } from "@/app/components/CollaborationHeader";
import { UserNamePrompt } from "@/app/components/UserNamePrompt";
import { ReleaseCalendarArea } from "@/app/components/retro/ReleaseCalendarArea";
import { SailboatArea } from "@/app/components/retro/SailboatArea";
import { ProcessesOverviewArea } from "@/app/components/retro/ProcessesOverviewArea";

export default function RetroBoard() {
  return (
    <div className="size-full flex flex-col bg-gray-100 overflow-hidden">
      <UserNamePrompt />
      <Cursors />
      <CollaborationHeader />

      {/* Page title bar */}
      <div className="px-6 py-4 bg-gradient-to-r from-violet-700 to-indigo-700 border-b-4 border-violet-800 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Release Retrospective Board</h1>
          <p className="text-violet-200 text-sm mt-0.5">Collaborative — up to 8 users</p>
        </div>
        <a
          href="/"
          className="text-sm font-medium text-violet-200 hover:text-white underline underline-offset-2 transition-colors"
        >
          ← Back to Mitigating Delays
        </a>
      </div>

      {/* Scrollable board container */}
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        <div className="flex flex-col gap-10 p-6" style={{ minWidth: "max-content" }}>
          {/* 1. Release Calendar */}
          <section>
            <ReleaseCalendarArea />
          </section>

          {/* 2. Sailboat */}
          <section>
            <SailboatArea />
          </section>

          {/* 3. Processes Overview */}
          <section>
            <ProcessesOverviewArea />
          </section>
        </div>
      </div>
    </div>
  );
}
