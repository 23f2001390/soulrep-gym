import { PlanType } from "@prisma/client";

export interface PlanConfig {
  name: string;
  price: number;
}

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  [PlanType.MONTHLY]: {
    name: "BASIC",
    price: 1499,
  },
  [PlanType.QUARTERLY]: {
    name: "PRO",
    price: 2999,
  },
  [PlanType.YEARLY]: {
    name: "ELITE",
    price: 4999,
  },
};

export function getPlanInfo(plan: PlanType): PlanConfig {
  return PLAN_CONFIGS[plan];
}
