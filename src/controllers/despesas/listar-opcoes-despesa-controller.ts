import { FastifyReply, FastifyRequest } from "fastify";
import {
  categoriasDespesaPadrao,
  formasPagamentoDespesaPadrao,
} from "../../use-cases/despesas/despesa-dados";

export async function listarOpcoesDespesaController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  // Opcoes para selects do frontend, mantendo categoria manual livre.
  return reply.status(200).send({
    categorias: categoriasDespesaPadrao,
    formasPagamento: formasPagamentoDespesaPadrao,
    permiteCategoriaManual: true,
  });
}
