import { makeLoginUsuarioFactory } from "../../factory/usuarios-factory/login-usuario-factory";
import { InvalidCredentialsError } from "../../use-cases/usuarios/login-usuario-usecase";
import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { prisma } from "../../lib/prisma";

export async function loginUsuarioController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const loginSchema = z.object({
    email: z.string().email("Email invalido"),
    senha: z.string().min(1, "A senha e obrigatoria"),
  });

  const { email, senha } = loginSchema.parse(request.body);

  try {
    const loginUsuario = makeLoginUsuarioFactory();
    const { usuario } = await loginUsuario.execute({ email, senha });
    const sessao = await prisma.sessaoUsuario.create({
      data: {
        usuarioId: usuario.id,
        expiraEm: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    const token = await reply.jwtSign({
      sub: usuario.id,
      role: usuario.role,
      sid: sessao.id,
    });

    reply.setCookie("fiorote_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return reply.status(200).send({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        plano: usuario.plano,
        premiumExpiraEm: usuario.premiumExpiraEm,
        temSenha: Boolean(usuario.senha),
      },
    });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return reply.status(401).send({ message: "Email ou senha invalidos" });
    }

    console.error("Erro ao fazer login:", error);
    return reply.status(500).send({ message: "Erro ao fazer login" });
  }
}
