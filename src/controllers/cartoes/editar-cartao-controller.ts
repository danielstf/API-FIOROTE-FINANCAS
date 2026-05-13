import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeEditarCartaoFactory } from "../../factory/cartoes-factory/editar-cartao-factory";
import {
  CartaoJaExisteError,
  CartaoNaoEncontradoError,
} from "../../use-cases/cartoes/cartao-dados";

const editarCartaoParamsSchema = z.object({
  cartaoId: z.string().uuid("Id do cartao invalido"),
});

const editarCartaoBodySchema = z.object({
  nome: z.string().trim().min(1, "O nome do cartao e obrigatorio"),
});

export async function editarCartaoController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { cartaoId } = editarCartaoParamsSchema.parse(request.params);
  const { nome } = editarCartaoBodySchema.parse(request.body);

  try {
    const editarCartao = makeEditarCartaoFactory();

    const cartao = await editarCartao.execute({
      usuarioId: request.user.sub,
      cartaoId,
      nome,
    });

    return reply.status(200).send(cartao);
  } catch (error) {
    if (error instanceof CartaoNaoEncontradoError) {
      return reply.status(404).send({ message: error.message });
    }

    if (error instanceof CartaoJaExisteError) {
      return reply.status(409).send({ message: error.message });
    }

    console.error("Erro ao editar cartao:", error);
    return reply.status(500).send({ message: "Erro ao editar cartao" });
  }
}
