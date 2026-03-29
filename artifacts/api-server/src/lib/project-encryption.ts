import { encrypt, decrypt, decryptField } from "./encryption";

type ProjectRow = {
  investmentAmount: string;
  delayRiskPercent: string;
  costOverrunPercent: string;
  covenantBreachPercent: string;
  decisionOutcome: string;
  decisionInsight: string;
  reputationalRisk: string;
  decisionConditions: string | null;
  [key: string]: unknown;
};

export type DecryptedProject<T extends ProjectRow> = Omit<T, 'investmentAmount' | 'delayRiskPercent' | 'costOverrunPercent' | 'covenantBreachPercent' | 'decisionConditions'> & {
  investmentAmount: number;
  delayRiskPercent: number;
  costOverrunPercent: number;
  covenantBreachPercent: number;
  decisionConditions: string[] | null;
};

function decryptNumeric(value: string): number {
  try {
    const decrypted = decrypt(value);
    return parseFloat(decrypted);
  } catch {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
}

export function decryptProjectFields<T extends ProjectRow>(p: T): DecryptedProject<T> {
  let conditions: string[] | null = null;
  if (p.decisionConditions) {
    try {
      const decrypted = decrypt(p.decisionConditions);
      conditions = JSON.parse(decrypted);
    } catch {
      try {
        conditions = JSON.parse(p.decisionConditions);
      } catch {
        conditions = [];
      }
    }
  }

  return {
    ...p,
    investmentAmount: decryptNumeric(p.investmentAmount),
    delayRiskPercent: decryptNumeric(p.delayRiskPercent),
    costOverrunPercent: decryptNumeric(p.costOverrunPercent),
    covenantBreachPercent: decryptNumeric(p.covenantBreachPercent),
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
    investmentAmount: encrypt(String(investmentAmount)),
    delayRiskPercent: encrypt(String(analysis.financialRisk.delayRiskPercent)),
    costOverrunPercent: encrypt(String(analysis.financialRisk.costOverrunPercent)),
    covenantBreachPercent: encrypt(String(analysis.financialRisk.covenantBreachPercent)),
    reputationalRisk: encrypt(analysis.financialRisk.reputationalRisk),
    decisionOutcome: encrypt(analysis.decision.outcome),
    decisionConditions: encrypt(JSON.stringify(analysis.decision.conditions)),
    decisionInsight: encrypt(analysis.decision.insight),
  };
}
