import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeCriarCartaoFactory } from "../../factory/cartoes-factory/criar-cartao-factory";
import { getPerfilFinanceiroId } from "../../lib/perfil-financeiro";
import {
  CartaoJaExisteError,
} from "../../use-cases/cartoes/cartao-dados";
import { UsuarioNaoEncontradoError } from "../../use-cases/cartoes/criar-cartao-usecase";

const criarCartaoBodySchema = z.object({
  nome: z.string().trim().min(1, "O nome do cartao e obrigatorio"),
  cor: z.number().int().min(0).optional().nullable(),
});

export async function criarCartaoController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { nome, cor } = criarCartaoBodySchema.parse(request.body);

  try {
    const criarCartao = makeCriarCartaoFactory();

    const cartao = await criarCartao.execute({
      usuarioId: request.user.sub,
      perfilFinanceiroId: getPerfilFinanceiroId(request),
      nome,
      cor,
    });

    return reply.status(201).send(cartao);
  } catch (error) {
    if (error instanceof UsuarioNaoEncontradoError) {
      return reply.status(404).send({ message: error.message });
    }

    if (error instanceof CartaoJaExisteError) {
      return reply.status(409).send({ message: error.message });
    }

    console.error("Erro ao criar cartao:", error);
    return reply.status(500).send({ message: "Erro ao criar cartao" });
  }
}
