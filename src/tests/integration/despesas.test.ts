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
import { mockUser, mockDespesa, mockCartao, mockPremiumUser } from "../helpers/factories";

const NOT_FOUND_UUID = "ffffffff-ffff-4fff-afff-ffffffffffff";
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
const inject = (method: Method, url: string, opts?: { body?: unknown; headers?: Record<string, string> }) =>
  app.inject({ method, url, headers: opts?.headers, payload: opts?.body as Record<string, unknown> });

describe("Despesas", () => {
  let token: string;

  beforeEach(() => {
    mockValidSession();
    token = createUserToken();
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUser);
  });

  describe("GET /despesas/opcoes", () => {
    it("deve retornar opções (200)", async () => {
      vi.mocked(prisma.despesa.findMany).mockResolvedValue([mockDespesa]);
      vi.mocked(prisma.cartaoCredito.findMany).mockResolvedValue([mockCartao]);

      const res = await inject("GET", "/despesas/opcoes", { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(200);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("GET", "/despesas/opcoes");
      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /despesas", () => {
    it("deve listar despesas (200)", async () => {
      vi.mocked(prisma.despesa.findMany).mockResolvedValue([mockDespesa]);
      vi.mocked(prisma.despesa.updateMany).mockResolvedValue({ count: 0 });

      const res = await inject("GET", "/despesas", { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(200);
    });

    it("deve filtrar por paga=true", async () => {
      vi.mocked(prisma.despesa.findMany).mockResolvedValue([]);
      vi.mocked(prisma.despesa.updateMany).mockResolvedValue({ count: 0 });

      const res = await inject("GET", "/despesas?paga=true", { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(200);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("GET", "/despesas");
      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /despesas/:despesaId", () => {
    it("deve retornar uma despesa pelo ID (200)", async () => {
      vi.mocked(prisma.despesa.findFirst).mockResolvedValue(mockDespesa);

      const res = await inject("GET", `/despesas/${mockDespesa.id}`, { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(200);
    });

    it("deve retornar 404 se não existir", async () => {
      vi.mocked(prisma.despesa.findFirst).mockResolvedValue(null);

      const res = await inject("GET", `/despesas/${NOT_FOUND_UUID}`, { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("GET", `/despesas/${mockDespesa.id}`);
      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /despesas", () => {
    it("deve criar uma despesa simples (201)", async () => {
      vi.mocked(prisma.despesa.create).mockResolvedValue(mockDespesa);

      const res = await inject("POST", "/despesas", {
        headers: bearerHeader(token),
        body: { nome: "Aluguel", valor: 1500 },
      });
      expect(res.statusCode).toBe(201);
    });

    it("deve criar despesa de cartão de crédito (201)", async () => {
      vi.mocked(prisma.cartaoCredito.findFirst).mockResolvedValue(mockCartao);
      vi.mocked(prisma.despesa.create).mockResolvedValue({
        ...mockDespesa,
        formaPagamento: "CARTAO_CREDITO",
        cartaoCreditoId: mockCartao.id,
      });

      const res = await inject("POST", "/despesas", {
        headers: bearerHeader(token),
        body: { nome: "Compra", valor: 299, formaPagamento: "CARTAO_CREDITO", cartaoCreditoId: mockCartao.id },
      });
      expect(res.statusCode).toBe(201);
    });

    it("deve retornar 400 ao usar CARTAO_CREDITO sem cartão", async () => {
      const res = await inject("POST", "/despesas", {
        headers: bearerHeader(token),
        body: { nome: "Compra", valor: 100, formaPagamento: "CARTAO_CREDITO" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("deve retornar 403 ao criar despesa fixa sem premium", async () => {
      const res = await inject("POST", "/despesas", {
        headers: bearerHeader(token),
        body: { nome: "Aluguel Fixo", valor: 1500, fixa: true },
      });
      expect(res.statusCode).toBe(403);
    });

    it("deve criar despesa fixa com premium (201)", async () => {
      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockPremiumUser);
      vi.mocked(prisma.despesa.create).mockResolvedValue({ ...mockDespesa, fixa: true });

      const res = await inject("POST", "/despesas", {
        headers: bearerHeader(createUserToken(TEST_PREMIUM_USER_ID)),
        body: { nome: "Aluguel Fixo", valor: 1500, fixa: true },
      });
      expect(res.statusCode).toBe(201);
    });

    it("deve retornar 400 com valor negativo", async () => {
      const res = await inject("POST", "/despesas", {
        headers: bearerHeader(token),
        body: { nome: "Despesa", valor: -50 },
      });
      expect(res.statusCode).toBe(400);
    });

    it("deve retornar 400 sem nome", async () => {
      const res = await inject("POST", "/despesas", {
        headers: bearerHeader(token),
        body: { valor: 100 },
      });
      expect(res.statusCode).toBe(400);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("POST", "/despesas", { body: { nome: "Aluguel", valor: 1500 } });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("PUT /despesas/:despesaId", () => {
    it("deve editar uma despesa (200)", async () => {
      vi.mocked(prisma.despesa.findFirst).mockResolvedValue(mockDespesa);
      vi.mocked(prisma.despesa.update).mockResolvedValue({ ...mockDespesa, descricao: "Novo" });

      const res = await inject("PUT", `/despesas/${mockDespesa.id}`, {
        headers: bearerHeader(token),
        body: { nome: "Aluguel Novo" },
      });
      expect(res.statusCode).toBe(200);
    });

    it("deve retornar 404 se não existir", async () => {
      vi.mocked(prisma.despesa.findFirst).mockResolvedValue(null);

      const res = await inject("PUT", `/despesas/${NOT_FOUND_UUID}`, {
        headers: bearerHeader(token),
        body: { nome: "Novo" },
      });
      expect(res.statusCode).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("PUT", `/despesas/${mockDespesa.id}`, { body: { nome: "Novo" } });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("PATCH /despesas/:despesaId/pagamento", () => {
    it("deve marcar despesa como paga (200)", async () => {
      vi.mocked(prisma.despesa.findFirst).mockResolvedValue(mockDespesa);
      vi.mocked(prisma.despesa.update).mockResolvedValue({ ...mockDespesa, paga: true });

      const res = await inject("PATCH", `/despesas/${mockDespesa.id}/pagamento`, {
        headers: bearerHeader(token),
        body: { paga: true },
      });
      expect(res.statusCode).toBe(200);
    });

    it("deve retornar 400 se paga não for boolean", async () => {
      const res = await inject("PATCH", `/despesas/${mockDespesa.id}/pagamento`, {
        headers: bearerHeader(token),
        body: { paga: "sim" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("deve retornar 404 se não existir", async () => {
      vi.mocked(prisma.despesa.findFirst).mockResolvedValue(null);

      const res = await inject("PATCH", `/despesas/${NOT_FOUND_UUID}/pagamento`, {
        headers: bearerHeader(token),
        body: { paga: true },
      });
      expect(res.statusCode).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("PATCH", `/despesas/${mockDespesa.id}/pagamento`, {
        body: { paga: true },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("DELETE /despesas/:despesaId", () => {
    it("deve excluir uma despesa (204)", async () => {
      vi.mocked(prisma.despesa.findFirst).mockResolvedValue(mockDespesa);
      vi.mocked(prisma.despesa.delete).mockResolvedValue(mockDespesa);

      const res = await inject("DELETE", `/despesas/${mockDespesa.id}`, { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(204);
    });

    it("deve retornar 404 se não existir", async () => {
      vi.mocked(prisma.despesa.findFirst).mockResolvedValue(null);

      const res = await inject("DELETE", `/despesas/${NOT_FOUND_UUID}`, { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("DELETE", `/despesas/${mockDespesa.id}`);
      expect(res.statusCode).toBe(401);
    });
  });
});
