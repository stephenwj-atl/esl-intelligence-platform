import { createContext, useContext, useState, type ReactNode } from "react";

export const ROLES = ["Analyst", "Investment Officer", "Admin"] as const;
export type Role = (typeof ROLES)[number];

interface RolePermissions {
  canDelete: boolean;
  canCreate: boolean;
  canManagePipelines: boolean;
  canViewAudit: boolean;
  canViewStructure: boolean;
  canViewFinancial: boolean;
  canViewESLServices: boolean;
  canRunScenarios: boolean;
  canGenerateProposals: boolean;
  canViewPortfolioOptimization: boolean;
  canViewCapitalDeployment: boolean;
  canViewGovernance: boolean;
}

const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  Analyst: {
    canDelete: false,
    canCreate: true,
    canManagePipelines: false,
    canViewAudit: false,
    canViewStructure: true,
    canViewFinancial: true,
    canViewESLServices: true,
    canRunScenarios: true,
    canGenerateProposals: true,
    canViewPortfolioOptimization: false,
    canViewCapitalDeployment: false,
    canViewGovernance: false,
  },
  "Investment Officer": {
    canDelete: false,
    canCreate: true,
    canManagePipelines: true,
    canViewAudit: false,
    canViewStructure: true,
    canViewFinancial: true,
    canViewESLServices: true,
    canRunScenarios: true,
    canGenerateProposals: true,
    canViewPortfolioOptimization: true,
    canViewCapitalDeployment: true,
    canViewGovernance: true,
  },
  Admin: {
    canDelete: true,
    canCreate: true,
    canManagePipelines: true,
    canViewAudit: true,
    canViewStructure: true,
    canViewFinancial: true,
    canViewESLServices: true,
    canRunScenarios: true,
    canGenerateProposals: true,
    canViewPortfolioOptimization: true,
    canViewCapitalDeployment: true,
    canViewGovernance: true,
  },
};

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  permissions: RolePermissions;
}

const RoleContext = createContext<RoleContextType>({
  role: "Analyst",
  setRole: () => {},
  permissions: ROLE_PERMISSIONS.Analyst,
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("Analyst");
  return (
    <RoleContext.Provider value={{ role, setRole, permissions: ROLE_PERMISSIONS[role] }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
