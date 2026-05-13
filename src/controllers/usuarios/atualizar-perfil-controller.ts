import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeAtualizarPerfilFactory } from "../../factory/usuarios-factory/atualizar-perfil-factory";
import { UsuarioNaoEncontradoError } from "../../use-cases/usuarios/atualizar-perfil-usecase";

const atualizarPerfilSchema = z.object({
  nome: z.string().trim().min(1, "O nome e obrigatorio"),
});

export async function atualizarPerfilController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { nome } = atualizarPerfilSchema.parse(request.body);

  try {
    const atualizarPerfil = makeAtualizarPerfilFactory();

    const { usuario } = await atualizarPerfil.execute({
      usuarioId: request.user.sub,
      nome,
    });

    return reply.status(200).send({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        plano: usuario.plano,
        premiumExpiraEm: usuario.premiumExpiraEm,
      },
    });
  } catch (error) {
    if (error instanceof UsuarioNaoEncontradoError) {
      return reply.status(404).send({ message: error.message });
    }

    console.error("Erro ao atualizar perfil:", error);
    return reply.status(500).send({ message: "Erro ao atualizar perfil" });
  }
}
