/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from "vitest";
import { vi } from "vitest";
import { app } from "../../app";
import { prisma } from "../../lib/prisma";
import { createUserToken, bearerHeader, mockValidSession } from "../helpers/auth";
import { mockUser, mockCartao } from "../helpers/factories";

const NOT_FOUND_UUID = "ffffffff-ffff-4fff-afff-ffffffffffff";
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
const inject = (method: Method, url: string, opts?: { body?: unknown; headers?: Record<string, string> }) =>
  app.inject({ method, url, headers: opts?.headers, payload: opts?.body as Record<string, unknown> });

describe("Cartões de Crédito", () => {
  let token: string;

  beforeEach(() => {
    mockValidSession();
    token = createUserToken();
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUser);
  });

  describe("GET /cartoes", () => {
    it("deve listar cartões (200) e retornar { cartoes: [...] }", async () => {
      vi.mocked(prisma.cartaoCredito.findMany).mockResolvedValue([mockCartao]);

      const res = await inject("GET", "/cartoes", { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveProperty("cartoes");
      expect(Array.isArray(res.json().cartoes)).toBe(true);
    });

    it("deve retornar lista vazia se não houver cartões", async () => {
      vi.mocked(prisma.cartaoCredito.findMany).mockResolvedValue([]);

      const res = await inject("GET", "/cartoes", { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(200);
      expect(res.json().cartoes).toHaveLength(0);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("GET", "/cartoes");
      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /cartoes", () => {
    it("deve criar um cartão (201)", async () => {
      vi.mocked(prisma.cartaoCredito.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.cartaoCredito.create).mockResolvedValue(mockCartao);

      const res = await inject("POST", "/cartoes", {
        headers: bearerHeader(token),
        body: { nome: "Nubank" },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json()).toHaveProperty("nome", "Nubank");
    });

    it("deve retornar 409 se já existir cartão com o mesmo nome", async () => {
      vi.mocked(prisma.cartaoCredito.findFirst).mockResolvedValue(mockCartao);

      const res = await inject("POST", "/cartoes", {
        headers: bearerHeader(token),
        body: { nome: "Nubank" },
      });
      expect(res.statusCode).toBe(409);
    });

    it("deve retornar 400 sem nome", async () => {
      const res = await inject("POST", "/cartoes", {
        headers: bearerHeader(token),
        body: {},
      });
      expect(res.statusCode).toBe(400);
    });

    it("deve retornar 400 com nome vazio", async () => {
      const res = await inject("POST", "/cartoes", {
        headers: bearerHeader(token),
        body: { nome: "" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("POST", "/cartoes", { body: { nome: "Itaú" } });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("PUT /cartoes/:cartaoId", () => {
    it("deve editar o cartão (200)", async () => {
      vi.mocked(prisma.cartaoCredito.findFirst).mockResolvedValue(mockCartao);
      vi.mocked(prisma.cartaoCredito.update).mockResolvedValue({ ...mockCartao, nome: "Bradesco" });

      const res = await inject("PUT", `/cartoes/${mockCartao.id}`, {
        headers: bearerHeader(token),
        body: { nome: "Bradesco" },
      });
      expect(res.statusCode).toBe(200);
    });

    it("deve retornar 404 se não existir", async () => {
      vi.mocked(prisma.cartaoCredito.findFirst).mockResolvedValue(null);

      const res = await inject("PUT", `/cartoes/${NOT_FOUND_UUID}`, {
        headers: bearerHeader(token),
        body: { nome: "Novo" },
      });
      expect(res.statusCode).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("PUT", `/cartoes/${mockCartao.id}`, { body: { nome: "Novo" } });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("DELETE /cartoes/:cartaoId", () => {
    it("deve excluir um cartão (204) via soft delete", async () => {
      vi.mocked(prisma.cartaoCredito.findFirst).mockResolvedValue(mockCartao);
      vi.mocked(prisma.cartaoCredito.update).mockResolvedValue({ ...mockCartao, deletedAt: new Date() });

      const res = await inject("DELETE", `/cartoes/${mockCartao.id}`, { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(204);
    });

    it("deve retornar 404 se não existir", async () => {
      vi.mocked(prisma.cartaoCredito.findFirst).mockResolvedValue(null);

      const res = await inject("DELETE", `/cartoes/${NOT_FOUND_UUID}`, { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("DELETE", `/cartoes/${mockCartao.id}`);
      expect(res.statusCode).toBe(401);
    });
  });
});
