/// <reference types="vitest/globals" />

// ─── Rate limit: desabilitado em testes ──────────────────────────────────────
vi.mock("@fastify/rate-limit", () => ({
  default: async function noopRateLimit() {},
}));

// ─── env deve ser o PRIMEIRO mock ────────────────────────────────────────────
vi.mock("../env/index", () => ({
  env: {
    PORT: 3334,
    DATABASE_URL: "postgresql://test:test@localhost:5432/test_db",
    NODE_ENV: "test",
    JWT_SECRET: "test-jwt-secret-must-be-long-enough-32chars",
    RESEND_API_KEY: "re_test_key_123",
    RESEND_FROM_EMAIL: "noreply@fiorote.com",
    FRONTEND_URL: "http://localhost:3000",
    APP_URL: "http://localhost:3334",
    MERCADO_PAGO_ACCESS_TOKEN: "APP_USR-test-access-token-fake",
    MERCADO_PAGO_SUBSCRIPTION_TOKEN: undefined,
    MERCADO_PAGO_PREAPPROVAL_PLAN_ID: undefined,
    MERCADO_PAGO_PAYER_EMAIL: undefined,
    MERCADO_PAGO_WEBHOOK_SECRET: "test-webhook-secret",
    PREMIUM_MONTHLY_PRICE: 8,
    PREMIUM_RECURRING_PRICE: 5,
    GOOGLE_CLIENT_ID: "test-google-client-id.apps.googleusercontent.com",
  },
}));

// ─── Prisma (mock completo com todos os métodos usados no projeto) ────────────
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
      findMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    receita: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    despesa: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    cartaoCredito: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    sugestao: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    perfilFinanceiro: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    pagamentoPremium: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    // Nota: reset de senha usa campos do próprio modelo Usuario (resetToken, resetTokenExp)
    categoria: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    receitaExcecaoRecorrencia: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    despesaExcecaoRecorrencia: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    $disconnect: vi.fn(),
    $transaction: vi.fn(),
  },
}));

// ─── Serviços externos ────────────────────────────────────────────────────────
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
    cancel: vi.fn().mockResolvedValue({ id: "preapproval-123", status: "canceled" }),
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
      getPayload: () => ({ sub: "google-sub-123", email: "google@example.com", name: "Google User" }),
    }),
  })),
}));

vi.mock("../lib/premium-access", () => ({
  bloquearUsuarioSemPremium: vi.fn().mockResolvedValue(false),
  bloquearRecursoPremiumSeNecessario: vi.fn().mockResolvedValue(false),
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("$2a$10$hashedPassword123"),
  compare: vi.fn().mockResolvedValue(true),
  default: {
    hash: vi.fn().mockResolvedValue("$2a$10$hashedPassword123"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// ─── Ciclo de vida ────────────────────────────────────────────────────────────
beforeAll(async () => {
  const { app } = await import("../app");
  await app.ready();
});

afterAll(async () => {
  const { app } = await import("../app");
  await app.close();
});

beforeEach(() => {
  vi.clearAllMocks();
});
