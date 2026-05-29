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
import { mockUser, mockPremiumUser, mockPerfil, TEST_PREMIUM_USER_ID } from "../helpers/factories";

describe("Perfis Financeiros", () => {
  let token: string;
  let premiumToken: string;

  beforeEach(() => {
    mockValidSession();
    token = createUserToken();
    premiumToken = createUserToken(TEST_PREMIUM_USER_ID);
  });

  // ─── GET /perfis ──────────────────────────────────────────────────────────────
  describe("GET /perfis", () => {
    it("deve listar perfis do usuário premium", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockPremiumUser);
      vi.mocked(prisma.perfilFinanceiro.findMany).mockResolvedValue([mockPerfil]);

      const res = await request(app.server)
        .get("/perfis")
        .set(bearerHeader(premiumToken));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).get("/perfis");
      expect(res.status).toBe(401);
    });
  });

  // ─── POST /perfis ─────────────────────────────────────────────────────────────
  describe("POST /perfis", () => {
    it("deve criar um perfil financeiro para usuário premium", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockPremiumUser);
      vi.mocked(prisma.perfilFinanceiro.create).mockResolvedValue(mockPerfil);

      const res = await request(app.server)
        .post("/perfis")
        .set(bearerHeader(premiumToken))
        .send({ nome: "Perfil Pessoal" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("nome");
    });

    it("deve retornar 403 para usuário sem premium", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);

      const res = await request(app.server)
        .post("/perfis")
        .set(bearerHeader(token))
        .send({ nome: "Perfil" });

      expect(res.status).toBe(403);
    });

    it("deve retornar 400 se o nome estiver ausente", async () => {
      const res = await request(app.server)
        .post("/perfis")
        .set(bearerHeader(premiumToken))
        .send({});

      expect(res.status).toBe(400);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server)
        .post("/perfis")
        .send({ nome: "Perfil" });

      expect(res.status).toBe(401);
    });
  });

  // ─── PUT /perfis/:perfilId ────────────────────────────────────────────────────
  describe("PUT /perfis/:perfilId", () => {
    it("deve editar um perfil financeiro", async () => {
      const perfilAtualizado = { ...mockPerfil, nome: "Perfil Atualizado" };
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockPremiumUser);
      vi.mocked(prisma.perfilFinanceiro.findFirst).mockResolvedValue(mockPerfil);
      vi.mocked(prisma.perfilFinanceiro.update).mockResolvedValue(perfilAtualizado);

      const res = await request(app.server)
        .put(`/perfis/${mockPerfil.id}`)
        .set(bearerHeader(premiumToken))
        .send({ nome: "Perfil Atualizado" });

      expect(res.status).toBe(200);
    });

    it("deve retornar 404 se o perfil não existir", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockPremiumUser);
      vi.mocked(prisma.perfilFinanceiro.findFirst).mockResolvedValue(null);

      const res = await request(app.server)
        .put("/perfis/id-inexistente")
        .set(bearerHeader(premiumToken))
        .send({ nome: "Novo Nome" });

      expect(res.status).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server)
        .put(`/perfis/${mockPerfil.id}`)
        .send({ nome: "Nome" });

      expect(res.status).toBe(401);
    });
  });

  // ─── DELETE /perfis/:perfilId ─────────────────────────────────────────────────
  describe("DELETE /perfis/:perfilId", () => {
    it("deve excluir um perfil financeiro", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockPremiumUser);
      vi.mocked(prisma.perfilFinanceiro.findFirst).mockResolvedValue(mockPerfil);
      vi.mocked(prisma.perfilFinanceiro.delete).mockResolvedValue(mockPerfil);

      const res = await request(app.server)
        .delete(`/perfis/${mockPerfil.id}`)
        .set(bearerHeader(premiumToken));

      expect(res.status).toBe(200);
    });

    it("deve retornar 404 se o perfil não existir", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockPremiumUser);
      vi.mocked(prisma.perfilFinanceiro.findFirst).mockResolvedValue(null);

      const res = await request(app.server)
        .delete("/perfis/id-inexistente")
        .set(bearerHeader(premiumToken));

      expect(res.status).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).delete(`/perfis/${mockPerfil.id}`);
      expect(res.status).toBe(401);
    });
  });
});
