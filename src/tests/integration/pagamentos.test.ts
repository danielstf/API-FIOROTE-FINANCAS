import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app";
import { prisma } from "../../lib/prisma";
import { vi } from "vitest";
import {
  createUserToken,
  bearerHeader,
  mockValidSession,
} from "../helpers/auth";
import {
  mockUser,
  mockPremiumUser,
  mockPagamentoCheckout,
  mockPagamentoAssinatura,
  TEST_PREMIUM_USER_ID,
} from "../helpers/factories";

describe("Pagamentos Premium", () => {
  let token: string;
  let premiumToken: string;

  beforeEach(() => {
    mockValidSession();
    token = createUserToken();
    premiumToken = createUserToken(TEST_PREMIUM_USER_ID);
  });

  // ─── GET /pagamentos/premium/status ──────────────────────────────────────────
  describe("GET /pagamentos/premium/status", () => {
    it("deve retornar status FREE para usuário sem premium", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.sessaoUsuario.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.pagamentoPremium.findMany).mockResolvedValue([]);
      vi.mocked(prisma.pagamentoPremium.findFirst).mockResolvedValue(null);

      const res = await request(app.server)
        .get("/pagamentos/premium/status")
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("plano");
      expect(res.body).toHaveProperty("precos");
    });

    it("deve retornar status PREMIUM para usuário premium", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockPremiumUser);
      vi.mocked(prisma.sessaoUsuario.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.pagamentoPremium.findMany).mockResolvedValue([]);
      vi.mocked(prisma.pagamentoPremium.findFirst).mockResolvedValue(
        mockPagamentoAssinatura,
      );

      const res = await request(app.server)
        .get("/pagamentos/premium/status")
        .set(bearerHeader(premiumToken));

      expect(res.status).toBe(200);
      expect(res.body.plano).toBe("PREMIUM");
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).get("/pagamentos/premium/status");
      expect(res.status).toBe(401);
    });
  });

  // ─── POST /pagamentos/premium/checkout ───────────────────────────────────────
  describe("POST /pagamentos/premium/checkout", () => {
    it("deve criar checkout mensal com sucesso", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.pagamentoPremium.updateMany).mockResolvedValue({
        count: 0,
      });
      vi.mocked(prisma.pagamentoPremium.create).mockResolvedValue(
        mockPagamentoCheckout,
      );
      vi.mocked(prisma.pagamentoPremium.update).mockResolvedValue(
        mockPagamentoCheckout,
      );

      const res = await request(app.server)
        .post("/pagamentos/premium/checkout")
        .set(bearerHeader(token))
        .send({ tipo: "MENSAL" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("checkoutUrl");
    });

    it("deve criar checkout recorrente com sucesso", async () => {
      const pagamentoRecorrente = {
        ...mockPagamentoCheckout,
        tipo: "ASSINATURA",
        mercadoPagoPreapprovalId: "preapproval-123",
      };
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.pagamentoPremium.updateMany).mockResolvedValue({
        count: 0,
      });
      vi.mocked(prisma.pagamentoPremium.create).mockResolvedValue(
        pagamentoRecorrente as any,
      );
      vi.mocked(prisma.pagamentoPremium.update).mockResolvedValue(
        pagamentoRecorrente as any,
      );

      const res = await request(app.server)
        .post("/pagamentos/premium/checkout")
        .set(bearerHeader(token))
        .send({ tipo: "RECORRENTE" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("checkoutUrl");
    });

    it("deve retornar 409 se o usuário já for premium", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockPremiumUser);

      const res = await request(app.server)
        .post("/pagamentos/premium/checkout")
        .set(bearerHeader(premiumToken))
        .send({ tipo: "MENSAL" });

      expect(res.status).toBe(409);
    });

    it("deve retornar 400 se o tipo for inválido", async () => {
      const res = await request(app.server)
        .post("/pagamentos/premium/checkout")
        .set(bearerHeader(token))
        .send({ tipo: "INVALIDO" });

      expect(res.status).toBe(400);
    });

    it("deve usar RECORRENTE como padrão se tipo não for informado", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.pagamentoPremium.updateMany).mockResolvedValue({
        count: 0,
      });
      vi.mocked(prisma.pagamentoPremium.create).mockResolvedValue(
        mockPagamentoCheckout,
      );
      vi.mocked(prisma.pagamentoPremium.update).mockResolvedValue(
        mockPagamentoCheckout,
      );

      const res = await request(app.server)
        .post("/pagamentos/premium/checkout")
        .set(bearerHeader(token))
        .send({});

      expect(res.status).toBe(201);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server)
        .post("/pagamentos/premium/checkout")
        .send({ tipo: "MENSAL" });

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /pagamentos/premium/cancelar ───────────────────────────────────────
  describe("POST /pagamentos/premium/cancelar", () => {
    it("deve cancelar assinatura recorrente com sucesso", async () => {
      const usuarioPremium = {
        ...mockPremiumUser,
        premiumExpiraEm: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(usuarioPremium);
      vi.mocked(prisma.pagamentoPremium.findFirst).mockResolvedValue(
        mockPagamentoAssinatura,
      );
      vi.mocked(prisma.pagamentoPremium.update).mockResolvedValue(
        mockPagamentoAssinatura,
      );
      vi.mocked(prisma.usuario.update).mockResolvedValue(usuarioPremium);

      const res = await request(app.server)
        .post("/pagamentos/premium/cancelar")
        .set(bearerHeader(premiumToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("usuario");
    });

    it("deve retornar 404 se não houver assinatura ativa", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);

      const res = await request(app.server)
        .post("/pagamentos/premium/cancelar")
        .set(bearerHeader(token));

      expect(res.status).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).post("/pagamentos/premium/cancelar");
      expect(res.status).toBe(401);
    });
  });
});

// ─── POST /webhooks/mercado-pago (sem JWT) ────────────────────────────────────
describe("Webhook MercadoPago", () => {
  it("deve processar webhook de pagamento com sucesso", async () => {
    vi.mocked(prisma.pagamentoPremium.findUnique).mockResolvedValue(
      mockPagamentoCheckout as any,
    );
    vi.mocked(prisma.pagamentoPremium.update).mockResolvedValue(
      mockPagamentoCheckout,
    );
    vi.mocked(prisma.usuario.update).mockResolvedValue(mockUser);

    const res = await request(app.server)
      .post("/webhooks/mercado-pago")
      .send({
        type: "payment",
        action: "payment.updated",
        data: { id: "pay-123" },
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("received", true);
  });

  it("deve processar webhook de preapproval com sucesso", async () => {
    vi.mocked(prisma.pagamentoPremium.findFirst).mockResolvedValue(
      mockPagamentoAssinatura,
    );
    vi.mocked(prisma.pagamentoPremium.update).mockResolvedValue(
      mockPagamentoAssinatura,
    );
    vi.mocked(prisma.usuario.update).mockResolvedValue(mockUser);

    const res = await request(app.server)
      .post("/webhooks/mercado-pago")
      .send({
        type: "subscription_preapproval",
        action: "updated",
        data: { id: "preapproval-123" },
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("received", true);
  });

  it("deve retornar 400 se o ID do recurso não for informado", async () => {
    const res = await request(app.server)
      .post("/webhooks/mercado-pago")
      .send({ type: "payment" });

    expect(res.status).toBe(400);
  });

  it("deve aceitar ID via query string (data.id)", async () => {
    vi.mocked(prisma.pagamentoPremium.findUnique).mockResolvedValue(
      mockPagamentoCheckout as any,
    );
    vi.mocked(prisma.pagamentoPremium.update).mockResolvedValue(
      mockPagamentoCheckout,
    );

    const res = await request(app.server)
      .post("/webhooks/mercado-pago?data.id=pay-456&type=payment")
      .send({});

    expect(res.status).toBe(200);
  });

  it("deve retornar 200 mesmo se o processamento falhar (evita reenvios)", async () => {
    const { mercadoPagoPayment } = await import("../../lib/mercadopago");
    vi.mocked(mercadoPagoPayment.get).mockRejectedValueOnce(
      new Error("MercadoPago indisponível"),
    );

    const res = await request(app.server)
      .post("/webhooks/mercado-pago")
      .send({ type: "payment", data: { id: "pay-error" } });

    expect(res.status).toBe(200);
  });
});
