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
import { mockUser, mockReceita, mockPremiumUser } from "../helpers/factories";

const NOT_FOUND_UUID = "ffffffff-ffff-4fff-afff-ffffffffffff";
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
const inject = (method: Method, url: string, opts?: { body?: unknown; headers?: Record<string, string> }) =>
  app.inject({ method, url, headers: opts?.headers, payload: opts?.body as Record<string, unknown> });

describe("Receitas", () => {
  let token: string;

  beforeEach(() => {
    mockValidSession();
    token = createUserToken();
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUser);
  });

  describe("GET /receitas/opcoes", () => {
    it("deve retornar opções (200)", async () => {
      vi.mocked(prisma.receita.findMany).mockResolvedValue([mockReceita]);

      const res = await inject("GET", "/receitas/opcoes", { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(200);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("GET", "/receitas/opcoes");
      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /receitas", () => {
    it("deve listar receitas (200)", async () => {
      vi.mocked(prisma.receita.findMany).mockResolvedValue([mockReceita]);
      vi.mocked(prisma.receita.updateMany).mockResolvedValue({ count: 0 });

      const res = await inject("GET", "/receitas", { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(200);
    });

    it("deve aceitar filtro por mês", async () => {
      vi.mocked(prisma.receita.findMany).mockResolvedValue([]);
      vi.mocked(prisma.receita.updateMany).mockResolvedValue({ count: 0 });

      const res = await inject("GET", "/receitas?mes=2024-05", { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(200);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("GET", "/receitas");
      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /receitas/:receitaId", () => {
    it("deve retornar uma receita pelo ID (200)", async () => {
      vi.mocked(prisma.receita.findFirst).mockResolvedValue(mockReceita);

      const res = await inject("GET", `/receitas/${mockReceita.id}`, { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(200);
    });

    it("deve retornar 404 se a receita não existir", async () => {
      vi.mocked(prisma.receita.findFirst).mockResolvedValue(null);

      const res = await inject("GET", `/receitas/${NOT_FOUND_UUID}`, { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("GET", `/receitas/${mockReceita.id}`);
      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /receitas", () => {
    it("deve criar uma receita simples (201)", async () => {
      vi.mocked(prisma.receita.create).mockResolvedValue(mockReceita);

      const res = await inject("POST", "/receitas", {
        headers: bearerHeader(token),
        body: { nome: "Salário", valor: 3000, mes: "2024-05" },
      });
      expect(res.statusCode).toBe(201);
    });

    it("deve retornar 403 ao criar receita fixa sem premium", async () => {
      const res = await inject("POST", "/receitas", {
        headers: bearerHeader(token),
        body: { nome: "Salário Fixo", valor: 3000, mes: "2024-05", fixa: true },
      });
      expect(res.statusCode).toBe(403);
    });

    it("deve criar receita fixa com premium (201)", async () => {
      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockPremiumUser);
      vi.mocked(prisma.receita.create).mockResolvedValue({ ...mockReceita, fixa: true });

      const res = await inject("POST", "/receitas", {
        headers: bearerHeader(createUserToken(TEST_PREMIUM_USER_ID)),
        body: { nome: "Salário Fixo", valor: 3000, mes: "2024-05", fixa: true },
      });
      expect(res.statusCode).toBe(201);
    });

    it("deve retornar 400 com valor negativo", async () => {
      const res = await inject("POST", "/receitas", {
        headers: bearerHeader(token),
        body: { nome: "Receita", valor: -100, mes: "2024-05" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("deve retornar 400 sem nome", async () => {
      const res = await inject("POST", "/receitas", {
        headers: bearerHeader(token),
        body: { valor: 1000, mes: "2024-05" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("POST", "/receitas", {
        body: { nome: "Salário", valor: 3000, mes: "2024-05" },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("PUT /receitas/:receitaId", () => {
    it("deve editar uma receita (200)", async () => {
      vi.mocked(prisma.receita.findFirst).mockResolvedValue(mockReceita);
      vi.mocked(prisma.receita.update).mockResolvedValue({ ...mockReceita, descricao: "Novo" });

      const res = await inject("PUT", `/receitas/${mockReceita.id}`, {
        headers: bearerHeader(token),
        body: { nome: "Salário Novo" },
      });
      expect(res.statusCode).toBe(200);
    });

    it("deve retornar 404 se a receita não existir", async () => {
      vi.mocked(prisma.receita.findFirst).mockResolvedValue(null);

      const res = await inject("PUT", `/receitas/${NOT_FOUND_UUID}`, {
        headers: bearerHeader(token),
        body: { nome: "Novo" },
      });
      expect(res.statusCode).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("PUT", `/receitas/${mockReceita.id}`, { body: { nome: "Novo" } });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("DELETE /receitas/:receitaId", () => {
    it("deve excluir uma receita (204)", async () => {
      vi.mocked(prisma.receita.findFirst).mockResolvedValue(mockReceita);
      vi.mocked(prisma.receita.delete).mockResolvedValue(mockReceita);

      const res = await inject("DELETE", `/receitas/${mockReceita.id}`, { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(204);
    });

    it("deve retornar 404 se a receita não existir", async () => {
      vi.mocked(prisma.receita.findFirst).mockResolvedValue(null);

      const res = await inject("DELETE", `/receitas/${NOT_FOUND_UUID}`, { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("DELETE", `/receitas/${mockReceita.id}`);
      expect(res.statusCode).toBe(401);
    });
  });
});
