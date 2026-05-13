import { FastifyReply, FastifyRequest } from "fastify";
import { nomesReceitaPadrao } from "../../use-cases/receitas/receita-mes";

export async function listarOpcoesReceitaController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  // Retorna nomes sugeridos para o select do frontend, mantendo digitacao manual livre.
  return reply.status(200).send({
    opcoes: nomesReceitaPadrao,
    permiteNomeManual: true,
  });
}
