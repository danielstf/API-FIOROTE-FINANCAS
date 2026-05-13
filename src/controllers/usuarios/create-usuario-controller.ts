import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeCreateUsuarioFactory } from "../../factory/usuarios-factory/create-usuario-factory";

export async function createUsuarioController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const createSchema = z.object({
    nome: z.string().min(1, "O nome e obrigatorio"),
    email: z.string().email("Email invalido"),
    senha: z.string().min(6, "A senha deve conter no minimo 6 caracteres"),
  });

  const { nome, email, senha } = createSchema.parse(request.body);

  try {
    const createUsuario = makeCreateUsuarioFactory();
    await createUsuario.execute({ nome, email, senha });

    return reply.status(201).send({ message: "Usuario criado com sucesso" });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Usuario ja existe com esse email"
    ) {
      return reply
        .status(409)
        .send({ message: "Usuario ja existe com esse email" });
    }

    console.error("Erro ao criar usuario:", error);
    return reply.status(500).send({ message: "Erro ao criar usuario" });
  }
}
