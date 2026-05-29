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
import { mockUser, mockReceita, mockPremiumUser } from "../helpers/factories";

describe("Receitas", () => {
  let token: string;

  beforeEach(() => {
    mockValidSession();
    token = createUserToken();
  });

  // ─── GET /receitas/opcoes ─────────────────────────────────────────────────────
  describe("GET /receitas/opcoes", () => {
    it("deve retornar opções de receitas com sucesso", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.receita.findMany).mockResolvedValue([mockReceita]);

      const res = await request(app.server)
        .get("/receitas/opcoes")
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).get("/receitas/opcoes");
      expect(res.status).toBe(401);
    });
  });

  // ─── GET /receitas ────────────────────────────────────────────────────────────
  describe("GET /receitas", () => {
    it("deve listar receitas do usuário", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.receita.findMany).mockResolvedValue([mockReceita]);

      const res = await request(app.server)
        .get("/receitas")
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("deve filtrar por mês via query string", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.receita.findMany).mockResolvedValue([mockReceita]);

      const res = await request(app.server)
        .get("/receitas?mes=2024-05")
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).get("/receitas");
      expect(res.status).toBe(401);
    });
  });

  // ─── GET /receitas/:receitaId ─────────────────────────────────────────────────
  describe("GET /receitas/:receitaId", () => {
    it("deve retornar uma receita pelo ID", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.receita.findFirst).mockResolvedValue(mockReceita);

      const res = await request(app.server)
        .get(`/receitas/${mockReceita.id}`)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id", mockReceita.id);
    });

    it("deve retornar 404 se a receita não existir", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.receita.findFirst).mockResolvedValue(null);

      const res = await request(app.server)
        .get("/receitas/id-inexistente")
        .set(bearerHeader(token));

      expect(res.status).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).get(`/receitas/${mockReceita.id}`);
      expect(res.status).toBe(401);
    });
  });

  // ─── POST /receitas ───────────────────────────────────────────────────────────
  describe("POST /receitas", () => {
    it("deve criar uma receita simples com sucesso", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.receita.create).mockResolvedValue(mockReceita);

      const res = await request(app.server)
        .post("/receitas")
        .set(bearerHeader(token))
        .send({
          nome: "Salário",
          valor: 3000,
          mes: "2024-05",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("nome", "Salário");
    });

    it("deve criar uma receita fixa (requer premium)", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockPremiumUser);
      vi.mocked(prisma.receita.create).mockResolvedValue({
        ...mockReceita,
        fixa: true,
      });

      const premiumToken = createUserToken(mockPremiumUser.id);
      const res = await request(app.server)
        .post("/receitas")
        .set(bearerHeader(premiumToken))
        .send({
          nome: "Salário Fixo",
          valor: 3000,
          mes: "2024-05",
          fixa: true,
        });

      expect(res.status).toBe(201);
    });

    it("deve retornar 403 ao criar receita fixa sem premium", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);

      const res = await request(app.server)
        .post("/receitas")
        .set(bearerHeader(token))
        .send({
          nome: "Salário Fixo",
          valor: 3000,
          mes: "2024-05",
          fixa: true,
        });

      expect(res.status).toBe(403);
    });

    it("deve retornar 400 se o valor for zero ou negativo", async () => {
      const res = await request(app.server)
        .post("/receitas")
        .set(bearerHeader(token))
        .send({
          nome: "Receita Inválida",
          valor: -100,
          mes: "2024-05",
        });

      expect(res.status).toBe(400);
    });

    it("deve retornar 400 se o nome estiver ausente", async () => {
      const res = await request(app.server)
        .post("/receitas")
        .set(bearerHeader(token))
        .send({ valor: 1000, mes: "2024-05" });

      expect(res.status).toBe(400);
    });

    it("deve retornar 400 se o mês for inválido", async () => {
      const res = await request(app.server)
        .post("/receitas")
        .set(bearerHeader(token))
        .send({
          nome: "Receita",
          valor: 1000,
          mes: "mes-invalido",
        });

      expect(res.status).toBe(400);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).post("/receitas").send({
        nome: "Salário",
        valor: 3000,
        mes: "2024-05",
      });

      expect(res.status).toBe(401);
    });
  });

  // ─── PUT /receitas/:receitaId ─────────────────────────────────────────────────
  describe("PUT /receitas/:receitaId", () => {
    it("deve editar uma receita com sucesso", async () => {
      const receitaAtualizada = { ...mockReceita, nome: "Salário Atualizado" };
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.receita.findFirst).mockResolvedValue(mockReceita);
      vi.mocked(prisma.receita.update).mockResolvedValue(receitaAtualizada);

      const res = await request(app.server)
        .put(`/receitas/${mockReceita.id}`)
        .set(bearerHeader(token))
        .send({ nome: "Salário Atualizado" });

      expect(res.status).toBe(200);
    });

    it("deve retornar 404 se a receita não existir", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.receita.findFirst).mockResolvedValue(null);

      const res = await request(app.server)
        .put("/receitas/id-inexistente")
        .set(bearerHeader(token))
        .send({ nome: "Novo Nome" });

      expect(res.status).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server)
        .put(`/receitas/${mockReceita.id}`)
        .send({ nome: "Novo Nome" });

      expect(res.status).toBe(401);
    });
  });

  // ─── DELETE /receitas/:receitaId ──────────────────────────────────────────────
  describe("DELETE /receitas/:receitaId", () => {
    it("deve excluir uma receita com sucesso", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.receita.findFirst).mockResolvedValue(mockReceita);
      vi.mocked(prisma.receita.delete).mockResolvedValue(mockReceita);

      const res = await request(app.server)
        .delete(`/receitas/${mockReceita.id}`)
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
    });

    it("deve retornar 404 se a receita não existir", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.receita.findFirst).mockResolvedValue(null);

      const res = await request(app.server)
        .delete("/receitas/id-inexistente")
        .set(bearerHeader(token));

      expect(res.status).toBe(404);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).delete(
        `/receitas/${mockReceita.id}`,
      );
      expect(res.status).toBe(401);
    });
  });
});
