import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeRedefinirSenhaFactory } from "../../factory/usuarios-factory/redefinir-senha-factory";
import { InvalidResetTokenError } from "../../use-cases/usuarios/redefinir-senha-usecase";

export async function redefinirSenhaController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const redefinirSenhaSchema = z.object({
    token: z.string().min(1, "Token obrigatorio"),
    senha: z.string().min(6, "A senha deve conter no minimo 6 caracteres"),
  });

  const { token, senha } = redefinirSenhaSchema.parse(request.body);

  try {
    const redefinirSenha = makeRedefinirSenhaFactory();
    await redefinirSenha.execute({ token, senha });

    return reply
      .status(200)
      .send({ message: "Senha redefinida com sucesso" });
  } catch (error) {
    if (error instanceof InvalidResetTokenError) {
      return reply.status(400).send({ message: error.message });
    }

    console.error("Erro ao redefinir senha:", error);
    return reply.status(500).send({ message: "Erro ao redefinir senha" });
  }
}
