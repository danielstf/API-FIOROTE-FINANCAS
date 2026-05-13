import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeExcluirCartaoFactory } from "../../factory/cartoes-factory/excluir-cartao-factory";
import { CartaoNaoEncontradoError } from "../../use-cases/cartoes/cartao-dados";

const excluirCartaoParamsSchema = z.object({
  cartaoId: z.string().uuid("Id do cartao invalido"),
});

export async function excluirCartaoController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { cartaoId } = excluirCartaoParamsSchema.parse(request.params);

  try {
    const excluirCartao = makeExcluirCartaoFactory();

    await excluirCartao.execute({
      usuarioId: request.user.sub,
      cartaoId,
    });

    return reply.status(204).send();
  } catch (error) {
    if (error instanceof CartaoNaoEncontradoError) {
      return reply.status(404).send({ message: error.message });
    }

    console.error("Erro ao excluir cartao:", error);
    return reply.status(500).send({ message: "Erro ao excluir cartao" });
  }
}
