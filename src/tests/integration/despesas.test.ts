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
  mockDespesa,
  mockCartao,
  mockPremiumUser,
  TEST_PREMIUM_USER_ID,
} from "../helpers/factories";

describe("Despesas", () => {
  let token: string;

  beforeEach(() => {
    mockValidSession();
    token = createUserToken();
  });

  // ─── GET /despesas/opcoes ─────────────────────────────────────────────────────
  describe("GET /despesas/opcoes", () => {
    it("deve retornar opções de despesas", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.despesa.findMany).mockResolvedValue([mockDespesa]);
      vi.mocked(prisma.cartaoCredito.findMany).mockResolvedValue([mockCartao]);

      const res = await request(app.server)
        .get("/despesas/opcoes")
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).get("/despesas/opcoes");
      expect(res.status).toBe(401);
    });
  });

  // ─── GET /despesas ────────────────────────────────────────────────────────────
  describe("GET /despesas", () => {
    it("deve listar despesas do usuário", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.despesa.findMany).mockResolvedValue([mockDespesa]);

      const res = await request(app.server)
        .get("/despesas")
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("deve filtrar despesas pagas", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.despesa.findMany).mockResolvedValue([]);

      const res = await request(app.server)
        .get("/despesas?paga=true")
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
    });

    it("deve filtrar apenas despesas de cartão", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.despesa.findMany).mockResolvedValue([]);

      const res = await request(app.server)
        .get("/despesas?somenteCartao=true")
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).get("/despesas");
      expect(res.status).toBe(401);
    });
  });

  // ─── GET /despesas/:despesaId ─────────────────────────────────────────────────
  describe("GET /despesas/:despesaId", () => {
    it("deve retornar uma despesa pelo ID", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.despesa.findFirst).mockResolvedValue(mockDespesa);

      const res = await request(app.server)
        .get(`/despesas/${mockDespesa.id}`)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id", mockDespesa.id);
    });

    it("deve retornar 404 se a despesa não existir", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.despesa.findFirst).mockResolvedValue(null);

      const res = await request(app.server)
        .get("/despesas/id-inexistente")
        .set(bearerHeader(token));

      expect(res.status).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).get(`/despesas/${mockDespesa.id}`);
      expect(res.status).toBe(401);
    });
  });

  // ─── POST /despesas ───────────────────────────────────────────────────────────
  describe("POST /despesas", () => {
    it("deve criar uma despesa simples com sucesso", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.despesa.create).mockResolvedValue(mockDespesa);

      const res = await request(app.server)
        .post("/despesas")
        .set(bearerHeader(token))
        .send({
          nome: "Aluguel",
          valor: 1500,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("nome", "Aluguel");
    });

    it("deve criar despesa de cartão de crédito", async () => {
      const despesaCartao = {
        ...mockDespesa,
        formaPagamento: "CARTAO_CREDITO",
        cartaoCreditoId: mockCartao.id,
      };
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.cartaoCredito.findFirst).mockResolvedValue(mockCartao);
      vi.mocked(prisma.despesa.create).mockResolvedValue(despesaCartao as any);

      const res = await request(app.server)
        .post("/despesas")
        .set(bearerHeader(token))
        .send({
          nome: "Compra Online",
          valor: 299,
          formaPagamento: "CARTAO_CREDITO",
          cartaoCreditoId: mockCartao.id,
        });

      expect(res.status).toBe(201);
    });

    it("deve retornar 400 ao usar CARTAO_CREDITO sem informar o cartão", async () => {
      const res = await request(app.server)
        .post("/despesas")
        .set(bearerHeader(token))
        .send({
          nome: "Compra",
          valor: 100,
          formaPagamento: "CARTAO_CREDITO",
        });

      expect(res.status).toBe(400);
    });

    it("deve retornar 403 ao criar despesa fixa sem premium", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);

      const res = await request(app.server)
        .post("/despesas")
        .set(bearerHeader(token))
        .send({
          nome: "Aluguel Fixo",
          valor: 1500,
          fixa: true,
        });

      expect(res.status).toBe(403);
    });

    it("deve criar despesa fixa com premium", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockPremiumUser);
      vi.mocked(prisma.despesa.create).mockResolvedValue({
        ...mockDespesa,
        fixa: true,
      });

      const premiumToken = createUserToken(TEST_PREMIUM_USER_ID);
      const res = await request(app.server)
        .post("/despesas")
        .set(bearerHeader(premiumToken))
        .send({
          nome: "Aluguel Fixo",
          valor: 1500,
          fixa: true,
        });

      expect(res.status).toBe(201);
    });

    it("deve retornar 400 se o valor for negativo", async () => {
      const res = await request(app.server)
        .post("/despesas")
        .set(bearerHeader(token))
        .send({ nome: "Despesa", valor: -50 });

      expect(res.status).toBe(400);
    });

    it("deve retornar 400 se o nome estiver ausente", async () => {
      const res = await request(app.server)
        .post("/despesas")
        .set(bearerHeader(token))
        .send({ valor: 100 });

      expect(res.status).toBe(400);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server)
        .post("/despesas")
        .send({ nome: "Aluguel", valor: 1500 });

      expect(res.status).toBe(401);
    });
  });

  // ─── PUT /despesas/:despesaId ─────────────────────────────────────────────────
  describe("PUT /despesas/:despesaId", () => {
    it("deve editar uma despesa com sucesso", async () => {
      const despesaAtualizada = { ...mockDespesa, nome: "Aluguel Novo" };
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.despesa.findFirst).mockResolvedValue(mockDespesa);
      vi.mocked(prisma.despesa.update).mockResolvedValue(despesaAtualizada);

      const res = await request(app.server)
        .put(`/despesas/${mockDespesa.id}`)
        .set(bearerHeader(token))
        .send({ nome: "Aluguel Novo" });

      expect(res.status).toBe(200);
    });

    it("deve retornar 404 se a despesa não existir", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.despesa.findFirst).mockResolvedValue(null);

      const res = await request(app.server)
        .put("/despesas/id-inexistente")
        .set(bearerHeader(token))
        .send({ nome: "Novo Nome" });

      expect(res.status).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server)
        .put(`/despesas/${mockDespesa.id}`)
        .send({ nome: "Novo Nome" });

      expect(res.status).toBe(401);
    });
  });

  // ─── PATCH /despesas/:despesaId/pagamento ─────────────────────────────────────
  describe("PATCH /despesas/:despesaId/pagamento", () => {
    it("deve marcar despesa como paga", async () => {
      const despesaPaga = { ...mockDespesa, paga: true };
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.despesa.findFirst).mockResolvedValue(mockDespesa);
      vi.mocked(prisma.despesa.update).mockResolvedValue(despesaPaga);

      const res = await request(app.server)
        .patch(`/despesas/${mockDespesa.id}/pagamento`)
        .set(bearerHeader(token))
        .send({ paga: true });

      expect(res.status).toBe(200);
    });

    it("deve retornar 400 se 'paga' não for boolean", async () => {
      const res = await request(app.server)
        .patch(`/despesas/${mockDespesa.id}/pagamento`)
        .set(bearerHeader(token))
        .send({ paga: "sim" });

      expect(res.status).toBe(400);
    });

    it("deve retornar 404 se a despesa não existir", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.despesa.findFirst).mockResolvedValue(null);

      const res = await request(app.server)
        .patch("/despesas/id-inexistente/pagamento")
        .set(bearerHeader(token))
        .send({ paga: true });

      expect(res.status).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server)
        .patch(`/despesas/${mockDespesa.id}/pagamento`)
        .send({ paga: true });

      expect(res.status).toBe(401);
    });
  });

  // ─── DELETE /despesas/:despesaId ──────────────────────────────────────────────
  describe("DELETE /despesas/:despesaId", () => {
    it("deve excluir uma despesa com sucesso", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.despesa.findFirst).mockResolvedValue(mockDespesa);
      vi.mocked(prisma.despesa.delete).mockResolvedValue(mockDespesa);

      const res = await request(app.server)
        .delete(`/despesas/${mockDespesa.id}`)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
    });

    it("deve retornar 404 se a despesa não existir", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.despesa.findFirst).mockResolvedValue(null);

      const res = await request(app.server)
        .delete("/despesas/id-inexistente")
        .set(bearerHeader(token));

      expect(res.status).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).delete(
        `/despesas/${mockDespesa.id}`,
      );
      expect(res.status).toBe(401);
    });
  });
});
