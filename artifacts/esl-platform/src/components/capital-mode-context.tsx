import { createContext, useContext, useState, type ReactNode } from "react";

export type CapitalMode = "Loan" | "Grant" | "Blended";

interface CapitalModeContextType {
  mode: CapitalMode;
  setMode: (mode: CapitalMode) => void;
}

const CapitalModeContext = createContext<CapitalModeContextType>({
  mode: "Loan",
  setMode: () => {},
});

export function CapitalModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<CapitalMode>("Loan");
  return (
    <CapitalModeContext.Provider value={{ mode, setMode }}>
      {children}
    </CapitalModeContext.Provider>
  );
}

export function useCapitalMode() {
  return useContext(CapitalModeContext);
}

export function CapitalModeSwitch() {
  const { mode, setMode } = useCapitalMode();
  const modes: CapitalMode[] = ["Loan", "Grant", "Blended"];

  return (
    <div className="flex items-center bg-secondary/60 rounded-lg p-0.5 border border-border/50">
      {modes.map(m => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${
            mode === m
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
