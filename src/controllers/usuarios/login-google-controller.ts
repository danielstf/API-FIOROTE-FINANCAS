import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeLoginGoogleFactory } from "../../factory/usuarios-factory/login-google-factory";
import { prisma } from "../../lib/prisma";
import {
  GoogleLoginNaoConfiguradoError,
  GoogleTokenInvalidoError,
} from "../../use-cases/usuarios/login-google-usecase";

const loginGoogleSchema = z.object({
  // Token de identidade retornado pelo Google no frontend.
  idToken: z.string().min(1, "Token do Google e obrigatorio"),
});

export async function loginGoogleController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { idToken } = loginGoogleSchema.parse(request.body);

  try {
    const loginGoogle = makeLoginGoogleFactory();
    const { usuario } = await loginGoogle.execute({ idToken });
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
    if (error instanceof GoogleLoginNaoConfiguradoError) {
      return reply.status(500).send({ message: error.message });
    }

    if (error instanceof GoogleTokenInvalidoError) {
      return reply.status(401).send({ message: error.message });
    }

    console.error("Erro ao fazer login com Google:", error);
    return reply.status(500).send({ message: "Erro ao fazer login com Google" });
  }
}
