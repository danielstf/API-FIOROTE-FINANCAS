interface RevenueCatEntitlement {
  expires_date: string | null;
  product_identifier: string;
  purchase_date: string;
}

interface RevenueCatSubscriber {
  entitlements: Record<string, RevenueCatEntitlement>;
}

interface RevenueCatResponse {
  subscriber: RevenueCatSubscriber;
}

export class RevenueCatErroError extends Error {
  constructor(public readonly status: number) {
    super(`RevenueCat retornou status ${status}`);
  }
}

export async function buscarAssinanteRevenuecat(
  revenuecatUserId: string,
  secretKey: string,
): Promise<RevenueCatSubscriber> {
  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(revenuecatUserId)}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "X-Platform": "android",
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new RevenueCatErroError(response.status);
  }

  const data = (await response.json()) as RevenueCatResponse;
  return data.subscriber;
}

export function entitlementAtivo(
  subscriber: RevenueCatSubscriber,
  entitlementId: string,
): RevenueCatEntitlement | null {
  const entitlement = subscriber.entitlements[entitlementId];
  if (!entitlement) return null;

  // expires_date null = compra vitalícia (nunca expira)
  if (entitlement.expires_date === null) return entitlement;

  return new Date(entitlement.expires_date) > new Date() ? entitlement : null;
}

export function calcularExpiracaoPorEntitlement(
  entitlement: RevenueCatEntitlement,
): Date {
  // Usa a data de expiração real do RevenueCat quando disponível
  if (entitlement.expires_date) {
    return new Date(entitlement.expires_date);
  }

  // Compra vitalícia: expira daqui a 100 anos (representação interna)
  const expira = new Date();
  expira.setFullYear(expira.getFullYear() + 100);
  return expira;
}
