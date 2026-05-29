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
import { mockUser, mockAdmin } from "../helpers/factories";

describe("Usuários", () => {
  // ─── POST /usuarios ──────────────────────────────────────────────────────────
  describe("POST /usuarios", () => {
    it("deve criar um usuário com sucesso e retornar 201", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.usuario.create).mockResolvedValue(mockUser);

      const res = await request(app.server).post("/usuarios").send({
        nome: "Usuário Novo",
        email: "novo@teste.com",
        senha: "Senha@123",
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("message");
    });

    it("deve retornar 400 se o email for inválido", async () => {
      const res = await request(app.server).post("/usuarios").send({
        nome: "Usuário",
        email: "email-invalido",
        senha: "Senha@123",
      });

      expect(res.status).toBe(400);
    });

    it("deve retornar 400 se o nome estiver ausente", async () => {
      const res = await request(app.server).post("/usuarios").send({
        email: "novo@teste.com",
        senha: "Senha@123",
      });

      expect(res.status).toBe(400);
    });

    it("deve retornar 400 se a senha estiver ausente", async () => {
      const res = await request(app.server).post("/usuarios").send({
        nome: "Usuário",
        email: "novo@teste.com",
      });

      expect(res.status).toBe(400);
    });

    it("deve retornar 409 se o email já estiver cadastrado", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);

      const res = await request(app.server).post("/usuarios").send({
        nome: "Outro Usuário",
        email: "usuario@teste.com",
        senha: "Senha@123",
      });

      expect(res.status).toBe(409);
    });
  });

  // ─── POST /login ─────────────────────────────────────────────────────────────
  describe("POST /login", () => {
    it("deve fazer login com sucesso e retornar token", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.sessaoUsuario.create).mockResolvedValue({
        id: "session-123",
        usuarioId: mockUser.id,
        expiraEm: new Date(),
        criadaEm: new Date(),
        atualizadaEm: new Date(),
        dispositivo: null,
      } as any);

      const res = await request(app.server).post("/login").send({
        email: "usuario@teste.com",
        senha: "Senha@123",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("usuario");
      expect(res.body.usuario).toHaveProperty("email", "usuario@teste.com");
      expect(res.body.usuario).not.toHaveProperty("senha");
    });

    it("deve retornar 401 para credenciais inválidas", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);

      const res = await request(app.server).post("/login").send({
        email: "naoexiste@teste.com",
        senha: "Senha@123",
      });

      expect(res.status).toBe(401);
    });

    it("deve retornar 400 se o email estiver ausente", async () => {
      const res = await request(app.server)
        .post("/login")
        .send({ senha: "Senha@123" });

      expect(res.status).toBe(400);
    });

    it("deve retornar 400 se a senha estiver ausente", async () => {
      const res = await request(app.server)
        .post("/login")
        .send({ email: "usuario@teste.com" });

      expect(res.status).toBe(400);
    });
  });

  // ─── GET /usuarios/perfil ─────────────────────────────────────────────────────
  describe("GET /usuarios/perfil", () => {
    beforeEach(() => {
      mockValidSession();
    });

    it("deve retornar o perfil do usuário autenticado", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);

      const token = createUserToken();
      const res = await request(app.server)
        .get("/usuarios/perfil")
        .set(bearerHeader(token));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("email", "usuario@teste.com");
      expect(res.body).not.toHaveProperty("senha");
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server).get("/usuarios/perfil");
      expect(res.status).toBe(401);
    });

    it("deve retornar 401 com token inválido", async () => {
      const res = await request(app.server)
        .get("/usuarios/perfil")
        .set({ Authorization: "Bearer token-invalido" });

      expect(res.status).toBe(401);
    });
  });

  // ─── PATCH /usuarios/perfil ───────────────────────────────────────────────────
  describe("PATCH /usuarios/perfil", () => {
    beforeEach(() => {
      mockValidSession();
    });

    it("deve atualizar o perfil com sucesso", async () => {
      const usuarioAtualizado = { ...mockUser, nome: "Nome Atualizado" };
      vi.mocked(prisma.usuario.update).mockResolvedValue(usuarioAtualizado);

      const token = createUserToken();
      const res = await request(app.server)
        .patch("/usuarios/perfil")
        .set(bearerHeader(token))
        .send({ nome: "Nome Atualizado" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("nome", "Nome Atualizado");
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server)
        .patch("/usuarios/perfil")
        .send({ nome: "Novo Nome" });

      expect(res.status).toBe(401);
    });
  });

  // ─── PATCH /usuarios/senha ────────────────────────────────────────────────────
  describe("PATCH /usuarios/senha", () => {
    beforeEach(() => {
      mockValidSession();
    });

    it("deve trocar a senha com sucesso", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.usuario.update).mockResolvedValue(mockUser);

      const token = createUserToken();
      const res = await request(app.server)
        .patch("/usuarios/senha")
        .set(bearerHeader(token))
        .send({
          senhaAtual: "SenhaAtual@123",
          novaSenha: "NovaSenha@456",
        });

      expect(res.status).toBe(200);
    });

    it("deve retornar 400 se a senha atual estiver errada", async () => {
      const { compare } = await import("bcryptjs");
      vi.mocked(compare).mockResolvedValueOnce(false as never);
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);

      const token = createUserToken();
      const res = await request(app.server)
        .patch("/usuarios/senha")
        .set(bearerHeader(token))
        .send({
          senhaAtual: "SenhaErrada",
          novaSenha: "NovaSenha@456",
        });

      expect(res.status).toBe(400);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await request(app.server)
        .patch("/usuarios/senha")
        .send({ senhaAtual: "SenhaAtual", novaSenha: "NovaSenha" });

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /esqueci-senha ──────────────────────────────────────────────────────
  describe("POST /esqueci-senha", () => {
    it("deve enviar email de redefinição (mesmo que o email não exista)", async () => {
      vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.redefinicaoSenha.create).mockResolvedValue({} as any);

      const res = await request(app.server)
        .post("/esqueci-senha")
        .send({ email: "usuario@teste.com" });

      expect(res.status).toBe(200);
    });

    it("deve retornar 400 se o email for inválido", async () => {
      const res = await request(app.server)
        .post("/esqueci-senha")
        .send({ email: "email-invalido" });

      expect(res.status).toBe(400);
    });
  });

  // ─── POST /redefinir-senha ────────────────────────────────────────────────────
  describe("POST /redefinir-senha", () => {
    it("deve redefinir a senha com token válido", async () => {
      vi.mocked(prisma.redefinicaoSenha.findFirst).mockResolvedValue({
        id: "redefinicao-id",
        usuarioId: mockUser.id,
        token: "valid-token",
        expiraEm: new Date(Date.now() + 60 * 60 * 1000),
        usado: false,
        criadoEm: new Date(),
      } as any);
      vi.mocked(prisma.redefinicaoSenha.updateMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.usuario.update).mockResolvedValue(mockUser);
      vi.mocked(prisma.sessaoUsuario.deleteMany).mockResolvedValue({ count: 0 });

      const res = await request(app.server).post("/redefinir-senha").send({
        token: "valid-token",
        novaSenha: "NovaSenha@123",
      });

      expect(res.status).toBe(200);
    });

    it("deve retornar 400 com token inválido", async () => {
      vi.mocked(prisma.redefinicaoSenha.findFirst).mockResolvedValue(null);

      const res = await request(app.server).post("/redefinir-senha").send({
        token: "token-invalido",
        novaSenha: "NovaSenha@123",
      });

      expect(res.status).toBe(400);
    });
  });
});
