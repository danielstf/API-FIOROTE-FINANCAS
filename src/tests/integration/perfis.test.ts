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
import { mockUser, mockPremiumUser, mockPerfil } from "../helpers/factories";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
const inject = (method: Method, url: string, opts?: { body?: unknown; headers?: Record<string, string> }) =>
  app.inject({ method, url, headers: opts?.headers, payload: opts?.body as Record<string, unknown> });

describe("Perfis Financeiros", () => {
  let token: string;
  let premiumToken: string;

  beforeEach(() => {
    mockValidSession();
    token = createUserToken();
    premiumToken = createUserToken(TEST_PREMIUM_USER_ID);
  });

  describe("GET /perfis", () => {
    it("deve listar perfis (200)", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockPremiumUser);
      vi.mocked(prisma.perfilFinanceiro.findMany).mockResolvedValue([mockPerfil]);

      const res = await inject("GET", "/perfis", { headers: bearerHeader(premiumToken) });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("GET", "/perfis");
      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /perfis", () => {
    it("deve criar um perfil para usuário premium (201)", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockPremiumUser);
      vi.mocked(prisma.perfilFinanceiro.create).mockResolvedValue(mockPerfil);

      const res = await inject("POST", "/perfis", {
        headers: bearerHeader(premiumToken),
        body: { nome: "Perfil Pessoal" },
      });
      expect(res.statusCode).toBe(201);
    });

    it("deve retornar 403 para usuário sem premium", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);

      const res = await inject("POST", "/perfis", {
        headers: bearerHeader(token),
        body: { nome: "Perfil" },
      });
      expect(res.statusCode).toBe(403);
    });

    it("deve retornar 400 sem nome", async () => {
      const res = await inject("POST", "/perfis", {
        headers: bearerHeader(premiumToken),
        body: {},
      });
      expect(res.statusCode).toBe(400);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("POST", "/perfis", { body: { nome: "Perfil" } });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("PUT /perfis/:perfilId", () => {
    it("deve editar um perfil (200)", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockPremiumUser);
      vi.mocked(prisma.perfilFinanceiro.findFirst).mockResolvedValue(mockPerfil);
      vi.mocked(prisma.perfilFinanceiro.update).mockResolvedValue({ ...mockPerfil, nome: "Atualizado" });

      const res = await inject("PUT", `/perfis/${mockPerfil.id}`, {
        headers: bearerHeader(premiumToken),
        body: { nome: "Atualizado" },
      });
      expect(res.statusCode).toBe(200);
    });

    it("deve retornar 404 se não existir", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockPremiumUser);
      vi.mocked(prisma.perfilFinanceiro.findFirst).mockResolvedValue(null);

      const res = await inject("PUT", "/perfis/id-inexistente", {
        headers: bearerHeader(premiumToken),
        body: { nome: "Novo" },
      });
      expect(res.statusCode).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("PUT", `/perfis/${mockPerfil.id}`, { body: { nome: "Nome" } });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("DELETE /perfis/:perfilId", () => {
    it("deve excluir um perfil (200)", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockPremiumUser);
      vi.mocked(prisma.perfilFinanceiro.findFirst).mockResolvedValue(mockPerfil);
      vi.mocked(prisma.perfilFinanceiro.delete).mockResolvedValue(mockPerfil);

      const res = await inject("DELETE", `/perfis/${mockPerfil.id}`, { headers: bearerHeader(premiumToken) });
      expect(res.statusCode).toBe(200);
    });

    it("deve retornar 404 se não existir", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockPremiumUser);
      vi.mocked(prisma.perfilFinanceiro.findFirst).mockResolvedValue(null);

      const res = await inject("DELETE", "/perfis/id-inexistente", { headers: bearerHeader(premiumToken) });
      expect(res.statusCode).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("DELETE", `/perfis/${mockPerfil.id}`);
      expect(res.statusCode).toBe(401);
    });
  });
});
