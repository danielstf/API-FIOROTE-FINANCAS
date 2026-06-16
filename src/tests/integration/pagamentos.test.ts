/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from "vitest";
import { vi } from "vitest";
import { app } from "../../app";
import { prisma } from "../../lib/prisma";
import {
  createUserToken,
  bearerHeader,
  mockValidSession,
  TEST_PREMIUM_USER_ID,
} from "../helpers/auth";
import { mockUser, mockPremiumUser, mockPagamentoCheckout, mockPagamentoAssinatura } from "../helpers/factories";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
const inject = (method: Method, url: string, opts?: { body?: unknown; headers?: Record<string, string> }) =>
  app.inject({ method, url, headers: opts?.headers, payload: opts?.body as Record<string, unknown> });

describe("Pagamentos Premium", () => {
  let token: string;
  let premiumToken: string;

  beforeEach(() => {
    mockValidSession();
    token = createUserToken();
    premiumToken = createUserToken(TEST_PREMIUM_USER_ID);
  });

  describe("GET /pagamentos/premium/status", () => {
    it("deve retornar status do plano (200)", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.pagamentoPremium.findMany).mockResolvedValue([]);
      vi.mocked(prisma.pagamentoPremium.findFirst).mockResolvedValue(null);

      const res = await inject("GET", "/pagamentos/premium/status", { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveProperty("plano");
      expect(res.json()).toHaveProperty("precos");
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("GET", "/pagamentos/premium/status");
      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /pagamentos/premium/checkout", () => {
    it("deve criar checkout RECORRENTE (201)", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.pagamentoPremium.updateMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.pagamentoPremium.create).mockResolvedValue(mockPagamentoAssinatura);
      vi.mocked(prisma.pagamentoPremium.update).mockResolvedValue(mockPagamentoAssinatura);

      const res = await inject("POST", "/pagamentos/premium/checkout", {
        headers: bearerHeader(token),
        body: { tipo: "RECORRENTE" },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json()).toHaveProperty("checkoutUrl");
    });

    it("deve retornar 409 se o usuário já for premium", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockPremiumUser);

      const res = await inject("POST", "/pagamentos/premium/checkout", {
        headers: bearerHeader(premiumToken),
        body: { tipo: "RECORRENTE" },
      });
      expect(res.statusCode).toBe(409);
    });

    it("deve retornar 400 com tipo inválido", async () => {
      const res = await inject("POST", "/pagamentos/premium/checkout", {
        headers: bearerHeader(token),
        body: { tipo: "INVALIDO" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("deve usar RECORRENTE como padrão", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.pagamentoPremium.updateMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.pagamentoPremium.create).mockResolvedValue(mockPagamentoAssinatura);
      vi.mocked(prisma.pagamentoPremium.update).mockResolvedValue(mockPagamentoAssinatura);

      const res = await inject("POST", "/pagamentos/premium/checkout", {
        headers: bearerHeader(token),
        body: {},
      });
      expect(res.statusCode).toBe(201);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("POST", "/pagamentos/premium/checkout", { body: { tipo: "RECORRENTE" } });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /pagamentos/premium/cancelar", () => {
    it("deve cancelar assinatura recorrente (200)", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockPremiumUser);
      vi.mocked(prisma.pagamentoPremium.findFirst).mockResolvedValue(mockPagamentoAssinatura);
      vi.mocked(prisma.pagamentoPremium.update).mockResolvedValue(mockPagamentoAssinatura);
      vi.mocked(prisma.usuario.update).mockResolvedValue(mockPremiumUser);

      const res = await inject("POST", "/pagamentos/premium/cancelar", {
        headers: bearerHeader(premiumToken),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveProperty("usuario");
    });

    it("deve retornar 404 se não houver assinatura ativa", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);

      const res = await inject("POST", "/pagamentos/premium/cancelar", { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("POST", "/pagamentos/premium/cancelar");
      expect(res.statusCode).toBe(401);
    });
  });
});

describe("Webhook MercadoPago", () => {
  it("deve processar webhook de pagamento (200)", async () => {
    vi.mocked(prisma.pagamentoPremium.findUnique).mockResolvedValue(mockPagamentoCheckout as never);
    vi.mocked(prisma.pagamentoPremium.update).mockResolvedValue(mockPagamentoCheckout);
    vi.mocked(prisma.usuario.update).mockResolvedValue(mockUser);

    const res = await inject("POST", "/webhooks/mercado-pago", {
      body: { type: "payment", action: "payment.updated", data: { id: "pay-123" } },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("received", true);
  });

  it("deve processar webhook de preapproval (200)", async () => {
    vi.mocked(prisma.pagamentoPremium.findFirst).mockResolvedValue(mockPagamentoAssinatura);
    vi.mocked(prisma.pagamentoPremium.update).mockResolvedValue(mockPagamentoAssinatura);
    vi.mocked(prisma.usuario.update).mockResolvedValue(mockUser);

    const res = await inject("POST", "/webhooks/mercado-pago", {
      body: { type: "subscription_preapproval", action: "updated", data: { id: "preapproval-123" } },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("received", true);
  });

  it("deve retornar 400 sem ID do recurso", async () => {
    const res = await inject("POST", "/webhooks/mercado-pago", { body: { type: "payment" } });
    expect(res.statusCode).toBe(400);
  });

  it("deve retornar 200 mesmo se o processamento falhar (sem reenvio)", async () => {
    const { mercadoPagoPayment } = await import("../../lib/mercadopago");
    vi.mocked(mercadoPagoPayment.get).mockRejectedValueOnce(new Error("MP indisponível"));

    const res = await inject("POST", "/webhooks/mercado-pago", {
      body: { type: "payment", data: { id: "pay-error" } },
    });
    expect(res.statusCode).toBe(200);
  });
});
