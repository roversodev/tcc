export type Plan = 'free' | 'plus' | 'pro'

export const planFeatures: Record<Plan, { estoque: boolean; movimentacoes: boolean; invites: boolean }> = {
  free: { estoque: false, movimentacoes: false, invites: false },
  plus: { estoque: true, movimentacoes: true, invites: false },
  pro:  { estoque: true, movimentacoes: true, invites: true },
}

export function canAccess(plan: Plan, feature: keyof (typeof planFeatures)['free']) {
  return planFeatures[plan][feature]
}