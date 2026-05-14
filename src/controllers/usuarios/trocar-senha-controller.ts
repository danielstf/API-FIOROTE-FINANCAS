import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeTrocarSenhaFactory } from "../../factory/usuarios-factory/trocar-senha-factory";
import { CurrentPasswordInvalidError } from "../../use-cases/usuarios/trocar-senha-usecase";

export async function trocarSenhaController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const trocarSenhaSchema = z.object({
    senhaAtual: z.string().optional(),
    novaSenha: z
      .string()
      .min(6, "A nova senha deve conter no minimo 6 caracteres"),
  });

  const { senhaAtual, novaSenha } = trocarSenhaSchema.parse(request.body);

  try {
    const trocarSenha = makeTrocarSenhaFactory();
    const { usuario } = await trocarSenha.execute({
      usuarioId: request.user.sub,
      senhaAtual,
      novaSenha,
    });

    return reply.status(200).send({
      message: "Senha alterada com sucesso",
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
    if (error instanceof CurrentPasswordInvalidError) {
      return reply.status(400).send({ message: error.message });
    }

    console.error("Erro ao trocar senha:", error);
    return reply.status(500).send({ message: "Erro ao trocar senha" });
  }
}
