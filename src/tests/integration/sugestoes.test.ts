/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from "vitest";
import { vi } from "vitest";
import { app } from "../../app";
import { prisma } from "../../lib/prisma";
import {
  createUserToken,
  createAdminToken,
  bearerHeader,
  mockValidSession,
} from "../helpers/auth";
import { mockUser, mockAdmin, mockSugestao } from "../helpers/factories";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
const inject = (method: Method, url: string, opts?: { body?: unknown; headers?: Record<string, string> }) =>
  app.inject({ method, url, headers: opts?.headers, payload: opts?.body as Record<string, unknown> });

describe("Sugestões", () => {
  let userToken: string;
  let adminToken: string;

  beforeEach(() => {
    mockValidSession();
    userToken = createUserToken();
    adminToken = createAdminToken();
  });

  describe("POST /sugestoes", () => {
    it("deve criar uma sugestão (201)", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUser);
      vi.mocked(prisma.sugestao.create).mockResolvedValue(mockSugestao);

      const res = await inject("POST", "/sugestoes", {
        headers: bearerHeader(userToken),
        body: { tipo: "SUGESTAO", titulo: "PDF Export", mensagem: "Seria legal ter exportação PDF" },
      });
      expect(res.statusCode).toBe(201);
    });

    it("deve retornar 400 sem campos obrigatórios", async () => {
      const res = await inject("POST", "/sugestoes", {
        headers: bearerHeader(userToken),
        body: { titulo: "Título" }, // faltam tipo e mensagem
      });
      expect(res.statusCode).toBe(400);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("POST", "/sugestoes", {
        body: { tipo: "SUGESTAO", titulo: "Título", mensagem: "Mensagem" },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /sugestoes (ADMIN)", () => {
    it("deve listar sugestões para admin (200)", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockAdmin);
      vi.mocked(prisma.sugestao.findMany).mockResolvedValue([mockSugestao]);

      const res = await inject("GET", "/sugestoes", { headers: bearerHeader(adminToken) });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
    });

    it("deve retornar 403 para usuário comum", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);

      const res = await inject("GET", "/sugestoes", { headers: bearerHeader(userToken) });
      expect(res.statusCode).toBe(403);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("GET", "/sugestoes");
      expect(res.statusCode).toBe(401);
    });
  });

  describe("PATCH /sugestoes/:sugestaoId/finalizar (ADMIN)", () => {
    it("deve finalizar uma sugestão (200)", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockAdmin);
      vi.mocked(prisma.sugestao.findFirst).mockResolvedValue(mockSugestao);
      vi.mocked(prisma.sugestao.update).mockResolvedValue({ ...mockSugestao, status: "CONCLUIDO" });

      const res = await inject("PATCH", `/sugestoes/${mockSugestao.id}/finalizar`, {
        headers: bearerHeader(adminToken),
      });
      expect(res.statusCode).toBe(200);
    });

    it("deve retornar 403 para usuário comum", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);

      const res = await inject("PATCH", `/sugestoes/${mockSugestao.id}/finalizar`, {
        headers: bearerHeader(userToken),
      });
      expect(res.statusCode).toBe(403);
    });

    it("deve retornar 404 se a sugestão não existir", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockAdmin);
      vi.mocked(prisma.sugestao.findFirst).mockResolvedValue(null);

      const res = await inject("PATCH", "/sugestoes/id-inexistente/finalizar", {
        headers: bearerHeader(adminToken),
      });
      expect(res.statusCode).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("PATCH", `/sugestoes/${mockSugestao.id}/finalizar`);
      expect(res.statusCode).toBe(401);
    });
  });

  describe("DELETE /sugestoes/:sugestaoId (ADMIN)", () => {
    it("deve excluir uma sugestão (200)", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockAdmin);
      vi.mocked(prisma.sugestao.findFirst).mockResolvedValue(mockSugestao);
      vi.mocked(prisma.sugestao.delete).mockResolvedValue(mockSugestao);

      const res = await inject("DELETE", `/sugestoes/${mockSugestao.id}`, {
        headers: bearerHeader(adminToken),
      });
      expect(res.statusCode).toBe(200);
    });

    it("deve retornar 403 para usuário comum", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);

      const res = await inject("DELETE", `/sugestoes/${mockSugestao.id}`, {
        headers: bearerHeader(userToken),
      });
      expect(res.statusCode).toBe(403);
    });

    it("deve retornar 404 se não existir", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockAdmin);
      vi.mocked(prisma.sugestao.findFirst).mockResolvedValue(null);

      const res = await inject("DELETE", "/sugestoes/id-inexistente", {
        headers: bearerHeader(adminToken),
      });
      expect(res.statusCode).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("DELETE", `/sugestoes/${mockSugestao.id}`);
      expect(res.statusCode).toBe(401);
    });
  });
});
