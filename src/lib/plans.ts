import { PlanType } from "@prisma/client";

export interface PlanConfig {
  name: string;
  price: number;
}

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  [PlanType.MONTHLY]: {
    name: "Basic",
    price: 1499,
  },
  [PlanType.QUARTERLY]: {
    name: "Pro",
    price: 2999,
  },
  [PlanType.YEARLY]: {
    name: "Elite",
    price: 4999,
  },
};

export function getPlanInfo(plan: PlanType): PlanConfig {
  return PLAN_CONFIGS[plan];
}
