import { type StageResult, STAGES } from "@/lib/stage-engine";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface StageStatusPanelProps {
  stageResult: StageResult;
}

export function StageStatusPanel({ stageResult }: StageStatusPanelProps) {
  const { currentStage, stageName, nextStage, blockingConditions } = stageResult;

  return (
    <div className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm p-4 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-sm font-mono font-bold text-primary">{currentStage}</span>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Current Stage</div>
          <div className="text-sm font-semibold text-foreground">{stageName}</div>
        </div>
      </div>

      {nextStage && (
        <div className="flex items-center gap-2 shrink-0">
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Next</div>
            <div className="text-sm text-muted-foreground">{nextStage}</div>
          </div>
        </div>
      )}

      {blockingConditions.length > 0 && (
        <div className="flex-1 md:border-l md:border-border/30 md:pl-4 md:ml-2">
          <div className="text-[10px] text-warning uppercase tracking-wider font-bold flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3 h-3" /> Blocking
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {blockingConditions.slice(0, 3).map((c, i) => (
              <span key={i} className="text-xs text-foreground/60">{c}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
