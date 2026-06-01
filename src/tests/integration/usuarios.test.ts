/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach } from "vitest";
import { vi } from "vitest";
import { app } from "../../app";
import { prisma } from "../../lib/prisma";
import {
  createUserToken,
  bearerHeader,
  mockValidSession,
} from "../helpers/auth";
import { mockUser } from "../helpers/factories";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
const inject = (method: Method, url: string, opts?: { body?: unknown; headers?: Record<string, string> }) =>
  app.inject({ method, url, headers: opts?.headers, payload: opts?.body as Record<string, unknown> });

describe("Usuários", () => {
  // ─── POST /usuarios ───────────────────────────────────────────────────────────
  describe("POST /usuarios", () => {
    it("deve criar um usuário (201)", async () => {
      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.usuario.create).mockResolvedValue(mockUser);

      const res = await inject("POST", "/usuarios", {
        body: { nome: "Novo Usuário", email: "novo@teste.com", senha: "Senha@123" },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json()).toHaveProperty("message");
    });

    it("deve retornar 400 com email inválido", async () => {
      const res = await inject("POST", "/usuarios", {
        body: { nome: "Usuário", email: "email-invalido", senha: "Senha@123" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("deve retornar 400 sem nome", async () => {
      const res = await inject("POST", "/usuarios", {
        body: { email: "novo@teste.com", senha: "Senha@123" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("deve retornar 409 se o email já estiver cadastrado", async () => {
      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUser);

      const res = await inject("POST", "/usuarios", {
        body: { nome: "Outro", email: "usuario@teste.com", senha: "Senha@123" },
      });
      expect(res.statusCode).toBe(409);
    });
  });

  // ─── POST /login ──────────────────────────────────────────────────────────────
  describe("POST /login", () => {
    it("deve retornar token no login (200)", async () => {
      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUser);
      vi.mocked(prisma.sessaoUsuario.create).mockResolvedValue({
        id: "44444444-4444-4444-a444-444444444444",
        usuarioId: mockUser.id,
        expiraEm: new Date(Date.now() + 86400000),
        criadaEm: new Date(),
        atualizadaEm: new Date(),
      } as never);

      const res = await inject("POST", "/login", {
        body: { email: "usuario@teste.com", senha: "Senha@123" },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveProperty("token");
      expect(res.json().usuario).not.toHaveProperty("senha");
    });

    it("deve retornar 401 com credenciais erradas", async () => {
      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null);

      const res = await inject("POST", "/login", {
        body: { email: "naoexiste@teste.com", senha: "Senha@123" },
      });
      expect(res.statusCode).toBe(401);
    });

    it("deve retornar 400 sem email", async () => {
      const res = await inject("POST", "/login", { body: { senha: "Senha@123" } });
      expect(res.statusCode).toBe(400);
    });

    it("deve retornar 400 sem senha", async () => {
      const res = await inject("POST", "/login", { body: { email: "usuario@teste.com" } });
      expect(res.statusCode).toBe(400);
    });
  });

  // ─── GET /usuarios/perfil ─────────────────────────────────────────────────────
  describe("GET /usuarios/perfil", () => {
    beforeEach(() => mockValidSession());

    it("deve retornar o perfil do usuário (200)", async () => {
      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUser);

      const res = await inject("GET", "/usuarios/perfil", {
        headers: bearerHeader(createUserToken()),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveProperty("email", "usuario@teste.com");
      expect(res.json()).not.toHaveProperty("senha");
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("GET", "/usuarios/perfil");
      expect(res.statusCode).toBe(401);
    });

    it("deve retornar 401 com token inválido", async () => {
      const res = await inject("GET", "/usuarios/perfil", {
        headers: { Authorization: "Bearer token-invalido" },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── PATCH /usuarios/perfil ───────────────────────────────────────────────────
  describe("PATCH /usuarios/perfil", () => {
    beforeEach(() => mockValidSession());

    it("deve atualizar o perfil (200)", async () => {
      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUser);
      vi.mocked(prisma.usuario.update).mockResolvedValue({ ...mockUser, nome: "Nome Novo" });

      const res = await inject("PATCH", "/usuarios/perfil", {
        headers: bearerHeader(createUserToken()),
        body: { nome: "Nome Novo" },
      });
      expect(res.statusCode).toBe(200);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("PATCH", "/usuarios/perfil", { body: { nome: "Novo" } });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── PATCH /usuarios/senha ────────────────────────────────────────────────────
  describe("PATCH /usuarios/senha", () => {
    beforeEach(() => mockValidSession());

    it("deve trocar a senha (200)", async () => {
      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUser);
      vi.mocked(prisma.usuario.update).mockResolvedValue(mockUser);

      const res = await inject("PATCH", "/usuarios/senha", {
        headers: bearerHeader(createUserToken()),
        body: { senhaAtual: "SenhaAtual@123", novaSenha: "NovaSenha@456" },
      });
      expect(res.statusCode).toBe(200);
    });

    it("deve retornar 400 com senha atual errada", async () => {
      const { compare } = await import("bcryptjs");
      vi.mocked(compare).mockResolvedValueOnce(false as never);
      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUser);

      const res = await inject("PATCH", "/usuarios/senha", {
        headers: bearerHeader(createUserToken()),
        body: { senhaAtual: "SenhaErrada", novaSenha: "NovaSenha@456" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("deve retornar 401 sem token", async () => {
      const res = await inject("PATCH", "/usuarios/senha", {
        body: { senhaAtual: "SenhaAtual", novaSenha: "NovaSenha" },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── POST /esqueci-senha ──────────────────────────────────────────────────────
  describe("POST /esqueci-senha", () => {
    it("deve aceitar solicitação de redefinição (200)", async () => {
      // findByEmail → findFirst, depois update para salvar resetToken
      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(mockUser);
      vi.mocked(prisma.usuario.update).mockResolvedValue(mockUser);

      const res = await inject("POST", "/esqueci-senha", {
        body: { email: "usuario@teste.com" },
      });
      expect(res.statusCode).toBe(200);
    });

    it("deve retornar 400 com email inválido", async () => {
      const res = await inject("POST", "/esqueci-senha", { body: { email: "invalido" } });
      expect(res.statusCode).toBe(400);
    });
  });

  // ─── POST /redefinir-senha ────────────────────────────────────────────────────
  describe("POST /redefinir-senha", () => {
    it("deve redefinir senha com token válido (200)", async () => {
      // findByResetToken → findFirst com resetToken/resetTokenExp válidos
      vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
        ...mockUser,
        resetToken: "valid-token",
        resetTokenExp: new Date(Date.now() + 3600000),
      });
      vi.mocked(prisma.usuario.update).mockResolvedValue(mockUser);

      const res = await inject("POST", "/redefinir-senha", {
        body: { token: "valid-token", senha: "NovaSenha@123" },
      });
      expect(res.statusCode).toBe(200);
    });

    it("deve retornar 400 com token inválido (sem match)", async () => {
      vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null);

      const res = await inject("POST", "/redefinir-senha", {
        body: { token: "token-invalido", senha: "NovaSenha@123" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("deve retornar 400 sem token", async () => {
      const res = await inject("POST", "/redefinir-senha", {
        body: { senha: "NovaSenha@123" },
      });
      expect(res.statusCode).toBe(400);
    });
  });
});
