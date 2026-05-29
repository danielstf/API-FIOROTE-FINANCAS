import { vi, beforeAll, afterAll, beforeEach } from "vitest";

// ─── Mocks de módulos externos (hoistados antes de qualquer import) ───────────

vi.mock("../lib/prisma", () => ({
  prisma: {
    usuario: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    sessaoUsuario: {
      create: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    receita: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    despesa: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    cartaoCredito: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    sugestao: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    perfilFinanceiro: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    pagamentoPremium: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    redefinicaoSenha: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $disconnect: vi.fn(),
    $transaction: vi.fn(),
  },
}));

vi.mock("../lib/resend", () => ({
  resend: {
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "email-id-123" }, error: null }),
    },
  },
}));

vi.mock("../lib/mercadopago", () => ({
  mercadoPagoClient: {},
  mercadoPagoPreference: {
    create: vi.fn().mockResolvedValue({
      id: "pref-123",
      init_point: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123",
      sandbox_init_point: "https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=123",
    }),
  },
  mercadoPagoPayment: {
    get: vi.fn().mockResolvedValue({
      id: "pay-123",
      status: "approved",
      external_reference: "ext-ref-123",
    }),
    search: vi.fn().mockResolvedValue({ results: [] }),
  },
  mercadoPagoPreapproval: {
    create: vi.fn().mockResolvedValue({
      id: "preapproval-123",
      init_point: "https://www.mercadopago.com.br/subscriptions/checkout",
      sandbox_init_point: null,
      status: "pending",
    }),
    get: vi.fn().mockResolvedValue({
      id: "preapproval-123",
      status: "authorized",
      external_reference: "ext-ref-123",
      next_payment_date: null,
    }),
    cancel: vi.fn().mockResolvedValue({
      id: "preapproval-123",
      status: "canceled",
    }),
  },
  MercadoPagoRequestError: class MercadoPagoRequestError extends Error {
    statusCode: number;
    responseBody: string;
    constructor(statusCode: number, responseBody: string) {
      super(`Mercado Pago retornou ${statusCode}: ${responseBody}`);
      this.statusCode = statusCode;
      this.responseBody = responseBody;
    }
  },
}));

vi.mock("../lib/mercadopago-webhook", () => ({
  verifyMercadoPagoSignature: vi.fn().mockReturnValue(true),
}));

vi.mock("google-auth-library", () => ({
  OAuth2Client: vi.fn().mockImplementation(() => ({
    verifyIdToken: vi.fn().mockResolvedValue({
      getPayload: () => ({
        sub: "google-sub-123",
        email: "google@example.com",
        name: "Google User",
      }),
    }),
  })),
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("$2a$10$hashedPassword123"),
  compare: vi.fn().mockResolvedValue(true),
  default: {
    hash: vi.fn().mockResolvedValue("$2a$10$hashedPassword123"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// ─── Ciclo de vida da aplicação ───────────────────────────────────────────────

import { app } from "../app";

beforeAll(async () => {
  await app.listen({ port: 0 });
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});
