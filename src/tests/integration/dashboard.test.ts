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
import { mockUser } from "../helpers/factories";

describe("Dashboard", () => {
  let token: string;

  beforeEach(() => {
    mockValidSession();
    token = createUserToken();
  });

  // ─── GET /dashboard/resumo-financeiro ─────────────────────────────────────────
  describe("GET /dashboard/resumo-financeiro", () => {
    beforeEach(() => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.receita.findMany).mockResolvedValue([]);
      vi.mocked(prisma.despesa.findMany).mockResolvedValue([]);
    });

    it("deve retornar o resumo financeiro do mês atual", async () => {
      const res = await request(app.server)
        .get("/dashboard/resumo-financeiro")
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it("deve aceitar filtro por mês e ano", async () => {
      const res = await request(app.server)
        .get("/dashboard/resumo-financeiro?mes=5&ano=2024")
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
    });

    it("deve aceitar filtro apenas por mês", async () => {
      const res = await request(app.server)
        .get("/dashboard/resumo-financeiro?mes=3")
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).get(
        "/dashboard/resumo-financeiro",
      );

      expect(res.status).toBe(401);
    });

    it("deve retornar 401 com token inválido", async () => {
      const res = await request(app.server)
        .get("/dashboard/resumo-financeiro")
        .set({ Authorization: "Bearer token-invalido-xyz" });

      expect(res.status).toBe(401);
    });
  });
});
