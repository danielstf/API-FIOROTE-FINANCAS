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
import { mockUser, mockAdmin, mockSugestao } from "../helpers/factories";

describe("Sugestões", () => {
  let userToken: string;
  let adminToken: string;

  beforeEach(() => {
    mockValidSession();
    userToken = createUserToken();
    adminToken = createAdminToken();
  });

  // ─── POST /sugestoes ──────────────────────────────────────────────────────────
  describe("POST /sugestoes", () => {
    it("deve criar uma sugestão com sucesso", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.sugestao.create).mockResolvedValue(mockSugestao);

      const res = await request(app.server)
        .post("/sugestoes")
        .set(bearerHeader(userToken))
        .send({
          descricao: "Seria legal ter exportação de relatórios em PDF",
          titulo: "Exportação PDF",
        });

      expect(res.status).toBe(201);
    });

    it("deve criar sugestão sem título", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.sugestao.create).mockResolvedValue(mockSugestao);

      const res = await request(app.server)
        .post("/sugestoes")
        .set(bearerHeader(userToken))
        .send({ descricao: "Uma sugestão sem título" });

      expect(res.status).toBe(201);
    });

    it("deve retornar 400 se a descrição estiver ausente", async () => {
      const res = await request(app.server)
        .post("/sugestoes")
        .set(bearerHeader(userToken))
        .send({ titulo: "Título sem descrição" });

      expect(res.status).toBe(400);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server)
        .post("/sugestoes")
        .send({ descricao: "Sugestão" });

      expect(res.status).toBe(401);
    });
  });

  // ─── GET /sugestoes (ADMIN) ───────────────────────────────────────────────────
  describe("GET /sugestoes", () => {
    it("deve listar sugestões para admin", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockAdmin);
      vi.mocked(prisma.sugestao.findMany).mockResolvedValue([mockSugestao]);

      const res = await request(app.server)
        .get("/sugestoes")
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("deve retornar 403 para usuário comum", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);

      const res = await request(app.server)
        .get("/sugestoes")
        .set(bearerHeader(userToken));

      expect(res.status).toBe(403);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).get("/sugestoes");
      expect(res.status).toBe(401);
    });
  });

  // ─── PATCH /sugestoes/:sugestaoId/finalizar (ADMIN) ──────────────────────────
  describe("PATCH /sugestoes/:sugestaoId/finalizar", () => {
    it("deve finalizar uma sugestão como admin", async () => {
      const sugestaoFinalizada = {
        ...mockSugestao,
        status: "CONCLUIDA",
      };
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockAdmin);
      vi.mocked(prisma.sugestao.findFirst).mockResolvedValue(mockSugestao);
      vi.mocked(prisma.sugestao.update).mockResolvedValue(
        sugestaoFinalizada as any,
      );

      const res = await request(app.server)
        .patch(`/sugestoes/${mockSugestao.id}/finalizar`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
    });

    it("deve retornar 403 para usuário comum", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);

      const res = await request(app.server)
        .patch(`/sugestoes/${mockSugestao.id}/finalizar`)
        .set(bearerHeader(userToken));

      expect(res.status).toBe(403);
    });

    it("deve retornar 404 se a sugestão não existir", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockAdmin);
      vi.mocked(prisma.sugestao.findFirst).mockResolvedValue(null);

      const res = await request(app.server)
        .patch("/sugestoes/id-inexistente/finalizar")
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).patch(
        `/sugestoes/${mockSugestao.id}/finalizar`,
      );

      expect(res.status).toBe(401);
    });
  });

  // ─── DELETE /sugestoes/:sugestaoId (ADMIN) ────────────────────────────────────
  describe("DELETE /sugestoes/:sugestaoId", () => {
    it("deve excluir uma sugestão como admin", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockAdmin);
      vi.mocked(prisma.sugestao.findFirst).mockResolvedValue(mockSugestao);
      vi.mocked(prisma.sugestao.delete).mockResolvedValue(mockSugestao);

      const res = await request(app.server)
        .delete(`/sugestoes/${mockSugestao.id}`)
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(200);
    });

    it("deve retornar 403 para usuário comum", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);

      const res = await request(app.server)
        .delete(`/sugestoes/${mockSugestao.id}`)
        .set(bearerHeader(userToken));

      expect(res.status).toBe(403);
    });

    it("deve retornar 404 se a sugestão não existir", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockAdmin);
      vi.mocked(prisma.sugestao.findFirst).mockResolvedValue(null);

      const res = await request(app.server)
        .delete("/sugestoes/id-inexistente")
        .set(bearerHeader(adminToken));

      expect(res.status).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).delete(
        `/sugestoes/${mockSugestao.id}`,
      );
      expect(res.status).toBe(401);
    });
  });
});
