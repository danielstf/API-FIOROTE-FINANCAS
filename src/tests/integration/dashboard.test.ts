/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from "vitest";
import { vi } from "vitest";
import { app } from "../../app";
import { prisma } from "../../lib/prisma";
import { createUserToken, bearerHeader, mockValidSession } from "../helpers/auth";
import { mockUser } from "../helpers/factories";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
const inject = (method: Method, url: string, opts?: { body?: unknown; headers?: Record<string, string> }) =>
  app.inject({ method, url, headers: opts?.headers, payload: opts?.body as Record<string, unknown> });

describe("Dashboard", () => {
  let token: string;

  beforeEach(() => {
    mockValidSession();
    token = createUserToken();
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
    vi.mocked(prisma.receita.findMany).mockResolvedValue([]);
    vi.mocked(prisma.despesa.findMany).mockResolvedValue([]);
  });

  describe("GET /dashboard/resumo-financeiro", () => {
    it("deve retornar resumo financeiro (200)", async () => {
      const res = await inject("GET", "/dashboard/resumo-financeiro", { headers: bearerHeader(token) });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toBeDefined();
    });

    it("deve aceitar filtro por mês e ano", async () => {
      const res = await inject("GET", "/dashboard/resumo-financeiro?mes=5&ano=2024", {
        headers: bearerHeader(token),
      });
      expect(res.statusCode).toBe(200);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("GET", "/dashboard/resumo-financeiro");
      expect(res.statusCode).toBe(401);
    });

    it("deve retornar 401 com token malformado", async () => {
      const res = await inject("GET", "/dashboard/resumo-financeiro", {
        headers: { Authorization: "Bearer token-invalido-xyz" },
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
