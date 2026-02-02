import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useStorage, useMutation, useSelf } from "@liveblocks/react/suspense";
import { LiveObject, LiveList } from "@liveblocks/client";

const STAGES = [
  { id: "refinement", label: "Refinement", color: "bg-blue-500" },
  { id: "investigation", label: "Investigation", color: "bg-emerald-500" },
  { id: "kickoff", label: "KickOff", color: "bg-amber-500" },
  { id: "pr-reviews", label: "PR Reviews", color: "bg-rose-500" },
  { id: "ux-reviews", label: "UX Reviews", color: "bg-purple-500" },
  { id: "technical-reviews", label: "Technical/Writer Reviews", color: "bg-cyan-500" },
  { id: "manual-testing", label: "Manual Testing", color: "bg-orange-500" },
  { id: "documentation", label: "Documentation", color: "bg-green-500" },
];

const PAIN_POINTS = [
  {
    title: "The \"Looming Deadline\" Cascade",
    setup: "A team member finishes a complex feature on Thursday afternoon for a Friday release cutoff. The PR is huge.",
    conflict: "A team member doing PR Review finds a logic flaw, which requires a code change. This invalidates the Manual Testing already in progress. Meanwhile, the UX Designer sees the final UI for the first time and realizes the padding is off, and the Technical Writer has requested UI labels change.",
    result: "A stressful weekend or a delayed release.",
  },
  {
    title: "The \"Ghosting\" Reviewer",
    setup: "A team member submits three small PRs. They sit in the queue for three days.",
    conflict: "The designated reviewers are swamped with their own coding tasks and \"don't want to lose their flow.\" By the time they review, the original developer has moved on to a new task and now has to context-switch back to the old one to fix minor comments.",
    result: "\"PR Rot.\" The code gets harder to merge and keep track of.",
  },
  {
    title: "The \"Over-the-Wall\" Documentation",
    setup: "The feature is \"Code Complete\" and passes technical/UX reviews. Only then is it handed to the person responsible for documentation/manual testing.",
    conflict: "The tester finds a bug that the technical reviewer missed because the reviewer only looked at the code, not the functionality. The technical writer realizes a specific edge case isn't covered, but the developer has taken time off and can't answer questions.",
    result: "The feature is \"done\" but can't be merged because the supporting materials aren't ready.",
  },
];

export function WorkflowStages() {
  const stageVotes = useStorage((root) => root.stageVotes) || [];
  const self = useSelf();
  const userName = (self?.presence?.name as string | undefined) || "Anonymous";

  const voteStage = useMutation(({ storage }, stageId: string, type: 'agree' | 'disagree') => {
    const votesList = storage.get("stageVotes") as unknown as LiveList<any>;
    const index = votesList.findIndex((stage: any) => stage.get("id") === stageId);
    
    if (index !== -1) {
      const stage = votesList.get(index);
      const agreedBy = stage?.get("agreedBy") || [];
      const disagreedBy = stage?.get("disagreedBy") || [];
      const agreeCount = stage?.get("agree") || 0;
      const disagreeCount = stage?.get("disagree") || 0;
      
      const clickedAgree = type === 'agree';
      const hasAgreed = agreedBy.includes(userName);
      const hasDisagreed = disagreedBy.includes(userName);
      
      if (clickedAgree) {
        if (hasAgreed) {
          // Remove agree vote
          stage?.set("agreedBy", agreedBy.filter((u: string) => u !== userName));
          stage?.set("agree", Math.max(0, agreeCount - 1));
        } else if (hasDisagreed) {
          // Change from disagree to agree
          stage?.set("disagreedBy", disagreedBy.filter((u: string) => u !== userName));
          stage?.set("disagree", Math.max(0, disagreeCount - 1));
          stage?.set("agreedBy", [...agreedBy, userName]);
          stage?.set("agree", agreeCount + 1);
        } else {
          // Add agree vote
          stage?.set("agreedBy", [...agreedBy, userName]);
          stage?.set("agree", agreeCount + 1);
        }
      } else {
        if (hasDisagreed) {
          // Remove disagree vote
          stage?.set("disagreedBy", disagreedBy.filter((u: string) => u !== userName));
          stage?.set("disagree", Math.max(0, disagreeCount - 1));
        } else if (hasAgreed) {
          // Change from agree to disagree
          stage?.set("agreedBy", agreedBy.filter((u: string) => u !== userName));
          stage?.set("agree", Math.max(0, agreeCount - 1));
          stage?.set("disagreedBy", [...disagreedBy, userName]);
          stage?.set("disagree", disagreeCount + 1);
        } else {
          // Add disagree vote
          stage?.set("disagreedBy", [...disagreedBy, userName]);
          stage?.set("disagree", disagreeCount + 1);
        }
      }
    }
  }, [userName]);

  const resetAllVotes = useMutation(({ storage }) => {
    const votesList = storage.get("stageVotes") as unknown as LiveList<any>;
    for (let i = 0; i < votesList.length; i++) {
      const stage = votesList.get(i);
      stage?.set("agree", 0);
      stage?.set("disagree", 0);
      stage?.set("agreedBy", []);
      stage?.set("disagreedBy", []);
    }
  }, []);

  return (
    <div className="px-6 py-6 bg-gray-50 border-b-4 border-gray-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Where Is Work Getting Stuck?</h2>
        <button
          onClick={resetAllVotes}
          className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
        >
          Reset All Votes
        </button>
      </div>
      
      {/* Pain Points Bubbles */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {PAIN_POINTS.map((painPoint, index) => (
          <div
            key={index}
            className="relative bg-white border-2 border-indigo-300 rounded-2xl p-4 shadow-md"
          >
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-indigo-300 rounded-full"></div>
            <div className="absolute top-4 -left-3 w-3 h-3 bg-white border-2 border-indigo-300 rounded-full"></div>
            <div className="space-y-2">
              <p className="text-center text-base font-bold text-indigo-700 mb-3">{painPoint.title}</p>
              <div className="text-left space-y-2 text-xs">
                <div>
                  <span className="font-bold text-gray-900">The Setup: </span>
                  <span className="text-gray-700">{painPoint.setup}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-900">The Conflict: </span>
                  <span className="text-gray-700">{painPoint.conflict}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-900">The Result: </span>
                  <span className="text-gray-700">{painPoint.result}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Stages Voting */}
      <div className="grid grid-cols-8 gap-3">
        {STAGES.map((stage) => {
          const stageData = Array.isArray(stageVotes) && stageVotes.find((s: any) => s.id === stage.id);
          const agreeCount = stageData?.agree || 0;
          const disagreeCount = stageData?.disagree || 0;
          const hasAgreed = stageData && (stageData.agreedBy || []).includes(userName);
          const hasDisagreed = stageData && (stageData.disagreedBy || []).includes(userName);
          const agreedByList = stageData?.agreedBy || [];
          const disagreedByList = stageData?.disagreedBy || [];

          return (
            <div
              key={stage.id}
              className={`${stage.color} text-white rounded-lg p-3 shadow-md flex flex-col items-center gap-2`}
            >
              <span className="text-sm font-medium text-center leading-tight">{stage.label}</span>
              
              <div className="flex gap-2 w-full">
                <div className="flex-1 relative group">
                  <button
                    onClick={() => voteStage(stage.id, 'agree')}
                    className={`w-full flex flex-col items-center gap-1 py-2 px-1 rounded transition-all ${
                      hasAgreed
                        ? 'bg-white/40 ring-2 ring-white'
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                  >
                    <ThumbsUp size={14} />
                    <span className="text-xs font-bold">{agreeCount}</span>
                  </button>
                  {agreedByList.length > 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {agreedByList.join(', ')}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 relative group">
                  <button
                    onClick={() => voteStage(stage.id, 'disagree')}
                    className={`w-full flex flex-col items-center gap-1 py-2 px-1 rounded transition-all ${
                      hasDisagreed
                        ? 'bg-white/40 ring-2 ring-white'
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                  >
                    <ThumbsDown size={14} />
                    <span className="text-xs font-bold">{disagreeCount}</span>
                  </button>
                  {disagreedByList.length > 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {disagreedByList.join(', ')}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              </div>
              
              {(hasAgreed || hasDisagreed) && (
                <span className="text-xs opacity-90">
                  {hasAgreed ? "✓ Agreed" : "✓ Disagreed"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
