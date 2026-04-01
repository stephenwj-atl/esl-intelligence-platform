import { encrypt, decrypt, decryptField } from "./encryption";

type ProjectRow = {
  investmentAmount: number;
  delayRiskPercent: number;
  costOverrunPercent: number;
  covenantBreachPercent: number;
  decisionOutcome: string;
  decisionInsight: string;
  reputationalRisk: string;
  decisionConditions: unknown;
  [key: string]: unknown;
};

export type DecryptedProject<T extends ProjectRow> = Omit<T, 'decisionConditions'> & {
  decisionConditions: string[] | null;
};

export function decryptProjectFields<T extends ProjectRow>(p: T): DecryptedProject<T> {
  let conditions: string[] | null = null;
  if (p.decisionConditions) {
    const raw = p.decisionConditions as string;
    try {
      const decrypted = decrypt(raw);
      conditions = JSON.parse(decrypted);
    } catch {
      try {
        conditions = typeof p.decisionConditions === 'string'
          ? JSON.parse(p.decisionConditions)
          : Array.isArray(p.decisionConditions) ? p.decisionConditions as string[] : [];
      } catch {
        conditions = [];
      }
    }
  }

  return {
    ...p,
    decisionOutcome: decryptField(p.decisionOutcome) || p.decisionOutcome,
    decisionInsight: decryptField(p.decisionInsight) || p.decisionInsight,
    reputationalRisk: decryptField(p.reputationalRisk) || p.reputationalRisk,
    decisionConditions: conditions,
  } as DecryptedProject<T>;
}

export function encryptProjectSensitiveFields(analysis: {
  financialRisk: {
    reputationalRisk: string;
    delayRiskPercent: number;
    costOverrunPercent: number;
    covenantBreachPercent: number;
  };
  decision: { outcome: string; conditions: string[]; insight: string };
}, investmentAmount: number) {
  return {
    investmentAmount,
    delayRiskPercent: analysis.financialRisk.delayRiskPercent,
    costOverrunPercent: analysis.financialRisk.costOverrunPercent,
    covenantBreachPercent: analysis.financialRisk.covenantBreachPercent,
    reputationalRisk: encrypt(analysis.financialRisk.reputationalRisk),
    decisionOutcome: encrypt(analysis.decision.outcome),
    decisionConditions: JSON.stringify(analysis.decision.conditions),
    decisionInsight: encrypt(analysis.decision.insight),
  };
}
