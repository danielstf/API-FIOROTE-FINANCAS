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
import { mockUser, mockAdmin } from "../helpers/factories";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
const inject = (method: Method, url: string, opts?: { body?: unknown; headers?: Record<string, string> }) =>
  app.inject({ method, url, headers: opts?.headers, payload: opts?.body as Record<string, unknown> });

describe("Admin", () => {
  let userToken: string;
  let adminToken: string;

  beforeEach(() => {
    mockValidSession();
    userToken = createUserToken();
    adminToken = createAdminToken();
  });

  describe("GET /admin/resumo", () => {
    it("deve retornar resumo da plataforma para admin (200)", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockAdmin);
      vi.mocked(prisma.usuario.count).mockResolvedValue(100);
      vi.mocked(prisma.receita.count).mockResolvedValue(500);
      vi.mocked(prisma.despesa.count).mockResolvedValue(800);
      vi.mocked(prisma.sugestao.count).mockResolvedValue(20);

      const res = await inject("GET", "/admin/resumo", { headers: bearerHeader(adminToken) });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toBeDefined();
    });

    it("deve retornar 403 para usuário comum", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);

      const res = await inject("GET", "/admin/resumo", { headers: bearerHeader(userToken) });
      expect(res.statusCode).toBe(403);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("GET", "/admin/resumo");
      expect(res.statusCode).toBe(401);
    });

    it("deve retornar 401 com token malformado", async () => {
      const res = await inject("GET", "/admin/resumo", {
        headers: { Authorization: "Bearer xyz.abc.def" },
      });
      expect(res.statusCode).toBe(401);
    });
  });
});

describe("Health Check", () => {
  it("GET / deve retornar status ok (200)", async () => {
    const res = await inject("GET", "/");
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("status", "ok");
  });

  it("GET /health deve retornar status ok (200)", async () => {
    const res = await inject("GET", "/health");
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("status", "ok");
  });

  it("rota inexistente deve retornar 404", async () => {
    const res = await inject("GET", "/rota-que-nao-existe");
    expect(res.statusCode).toBe(404);
  });
});
