import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../app";
import { prisma } from "../../lib/prisma";
import { vi } from "vitest";
import {
  createUserToken,
  createAdminToken,
  bearerHeader,
  mockValidSession,
} from "../helpers/auth";
import { mockUser, mockAdmin } from "../helpers/factories";

describe("Admin", () => {
  let userToken: string;
  let adminToken: string;

  beforeEach(() => {
    mockValidSession();
    userToken = createUserToken();
    adminToken = createAdminToken();
  });

  // ─── GET /admin/resumo ────────────────────────────────────────────────────────
  describe("GET /admin/resumo", () => {
    it("deve retornar resumo da plataforma para admin", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockAdmin);
      vi.mocked(prisma.usuario.count).mockResolvedValue(100);
      vi.mocked(prisma.receita.count).mockResolvedValue(500);
      vi.mocked(prisma.despesa.count).mockResolvedValue(800);
      vi.mocked(prisma.sugestao.count).mockResolvedValue(20);

      const res = await request(app.server)
        .get("/admin/resumo")
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it("deve retornar 403 para usuário comum", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);

      const res = await request(app.server)
        .get("/admin/resumo")
        .set(bearerHeader(userToken));

      expect(res.status).toBe(403);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).get("/admin/resumo");
      expect(res.status).toBe(401);
    });

    it("deve retornar 401 com token malformado", async () => {
      const res = await request(app.server)
        .get("/admin/resumo")
        .set({ Authorization: "Bearer xyz.abc.def" });

      expect(res.status).toBe(401);
    });
  });
});

// ─── Rotas de health check ────────────────────────────────────────────────────
describe("Health Check", () => {
  it("GET / deve retornar status ok", async () => {
    const res = await request(app.server).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
  });

  it("GET /health deve retornar status ok", async () => {
    const res = await request(app.server).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
  });

  it("rota inexistente deve retornar 404", async () => {
    const res = await request(app.server).get("/rota-que-nao-existe");
    expect(res.status).toBe(404);
  });
});
