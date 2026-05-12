import { makeCreateUsuarioFactory } from "../../factory/usuarios-factory/create-usuario-factory";
import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export async function createUsuarioController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const createSchema = z.object({
    nome: z.string().min(1, "O nome é obrigatório"),
    email: z.string().email("Email inválido"),
    senha: z.string().min(6, "A senha deve conter no mínimo 6 caracteres"),
  });

  const { nome, email, senha } = createSchema.parse(request.body);

  try {
    const createUsuario = makeCreateUsuarioFactory();
    await createUsuario.execute({ nome, email, senha });

    return reply.status(201).send({ message: "Usuário criado com sucesso" });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return reply.status(500).send({ message: "Erro ao criar usuário" });
  }
}
