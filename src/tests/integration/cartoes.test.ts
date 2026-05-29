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
import { mockUser, mockCartao } from "../helpers/factories";

describe("Cartões de Crédito", () => {
  let token: string;

  beforeEach(() => {
    mockValidSession();
    token = createUserToken();
  });

  // ─── GET /cartoes ─────────────────────────────────────────────────────────────
  describe("GET /cartoes", () => {
    it("deve listar cartões do usuário", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.cartaoCredito.findMany).mockResolvedValue([mockCartao]);

      const res = await request(app.server)
        .get("/cartoes")
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty("nome", "Nubank");
    });

    it("deve retornar lista vazia se não houver cartões", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.cartaoCredito.findMany).mockResolvedValue([]);

      const res = await request(app.server)
        .get("/cartoes")
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).get("/cartoes");
      expect(res.status).toBe(401);
    });
  });

  // ─── POST /cartoes ────────────────────────────────────────────────────────────
  describe("POST /cartoes", () => {
    it("deve criar um cartão com sucesso", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.cartaoCredito.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.cartaoCredito.create).mockResolvedValue(mockCartao);

      const res = await request(app.server)
        .post("/cartoes")
        .set(bearerHeader(token))
        .send({ nome: "Nubank" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("nome", "Nubank");
    });

    it("deve retornar 409 se já existir cartão com o mesmo nome", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.cartaoCredito.findFirst).mockResolvedValue(mockCartao);

      const res = await request(app.server)
        .post("/cartoes")
        .set(bearerHeader(token))
        .send({ nome: "Nubank" });

      expect(res.status).toBe(409);
    });

    it("deve retornar 400 se o nome estiver ausente", async () => {
      const res = await request(app.server)
        .post("/cartoes")
        .set(bearerHeader(token))
        .send({});

      expect(res.status).toBe(400);
    });

    it("deve retornar 400 se o nome estiver vazio", async () => {
      const res = await request(app.server)
        .post("/cartoes")
        .set(bearerHeader(token))
        .send({ nome: "" });

      expect(res.status).toBe(400);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server)
        .post("/cartoes")
        .send({ nome: "Itaú" });

      expect(res.status).toBe(401);
    });
  });

  // ─── PUT /cartoes/:cartaoId ───────────────────────────────────────────────────
  describe("PUT /cartoes/:cartaoId", () => {
    it("deve editar o nome do cartão com sucesso", async () => {
      const cartaoAtualizado = { ...mockCartao, nome: "Bradesco" };
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.cartaoCredito.findFirst).mockResolvedValue(mockCartao);
      vi.mocked(prisma.cartaoCredito.update).mockResolvedValue(cartaoAtualizado);

      const res = await request(app.server)
        .put(`/cartoes/${mockCartao.id}`)
        .set(bearerHeader(token))
        .send({ nome: "Bradesco" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("nome", "Bradesco");
    });

    it("deve retornar 404 se o cartão não existir", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.cartaoCredito.findFirst).mockResolvedValue(null);

      const res = await request(app.server)
        .put("/cartoes/id-inexistente")
        .set(bearerHeader(token))
        .send({ nome: "Novo Nome" });

      expect(res.status).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server)
        .put(`/cartoes/${mockCartao.id}`)
        .send({ nome: "Novo Nome" });

      expect(res.status).toBe(401);
    });
  });

  // ─── DELETE /cartoes/:cartaoId ────────────────────────────────────────────────
  describe("DELETE /cartoes/:cartaoId", () => {
    it("deve excluir um cartão com sucesso", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.cartaoCredito.findFirst).mockResolvedValue(mockCartao);
      vi.mocked(prisma.cartaoCredito.delete).mockResolvedValue(mockCartao);

      const res = await request(app.server)
        .delete(`/cartoes/${mockCartao.id}`)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
    });

    it("deve retornar 404 se o cartão não existir", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.cartaoCredito.findFirst).mockResolvedValue(null);

      const res = await request(app.server)
        .delete("/cartoes/id-inexistente")
        .set(bearerHeader(token));

      expect(res.status).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).delete(`/cartoes/${mockCartao.id}`);
      expect(res.status).toBe(401);
    });
  });
});
