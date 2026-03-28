import { STAGES, type StageResult } from "@/lib/stage-engine";
import { CheckCircle, ChevronRight } from "lucide-react";

interface StageFlowBarProps {
  stageResult: StageResult;
}

export function StageFlowBar({ stageResult }: StageFlowBarProps) {
  const { currentStage, completedStages } = stageResult;

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto py-1 px-1">
      {STAGES.map((stage, i) => {
        const isCompleted = completedStages.includes(stage.id) && stage.id < currentStage;
        const isCurrent = stage.id === currentStage;
        const isFuture = stage.id > currentStage;

        return (
          <div key={stage.id} className="flex items-center shrink-0">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                isCurrent
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : isCompleted
                  ? "bg-success/10 text-success/80 border border-success/20"
                  : "bg-secondary/30 text-muted-foreground/40 border border-transparent"
              }`}
            >
              {isCompleted && <CheckCircle className="w-3 h-3" />}
              {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
              <span>{stage.shortName}</span>
            </div>
            {i < STAGES.length - 1 && (
              <ChevronRight className={`w-3 h-3 mx-0.5 shrink-0 ${
                isCompleted ? "text-success/40" : isCurrent ? "text-primary/40" : "text-muted-foreground/20"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
