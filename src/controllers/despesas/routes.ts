import { FastifyInstance } from "fastify";
import { JWTVerify } from "../../middlewares/jwt-verify";
import { alterarPagamentoDespesaController } from "./alterar-pagamento-despesa-controller";
import { criarDespesaController } from "./criar-despesa-controller";
import { editarDespesaController } from "./editar-despesa-controller";
import { excluirDespesaController } from "./excluir-despesa-controller";
import { listarDespesasController } from "./listar-despesas-controller";
import { listarOpcoesDespesaController } from "./listar-opcoes-despesa-controller";
import { obterDespesaController } from "./obter-despesa-controller";

export function despesasRoutes(app: FastifyInstance) {
  // Opcoes padrao para categoria e forma de pagamento da despesa.
  app.get(
    "/despesas/opcoes",
    {
      preHandler: [JWTVerify],
    },
    listarOpcoesDespesaController,
  );

  // Lista despesas com filtros: somenteCartao, somenteVencidas, paga e formaPagamento.
  app.get(
    "/despesas",
    {
      preHandler: [JWTVerify],
    },
    listarDespesasController,
  );

  // Visualiza uma despesa especifica.
  app.get(
    "/despesas/:despesaId",
    {
      preHandler: [JWTVerify],
    },
    obterDespesaController,
  );

  // Cadastra uma nova despesa.
  app.post(
    "/despesas",
    {
      preHandler: [JWTVerify],
    },
    criarDespesaController,
  );

  // Edita dados de uma despesa.
  app.put(
    "/despesas/:despesaId",
    {
      preHandler: [JWTVerify],
    },
    editarDespesaController,
  );

  // Marca ou desmarca uma despesa como paga.
  app.patch(
    "/despesas/:despesaId/pagamento",
    {
      preHandler: [JWTVerify],
    },
    alterarPagamentoDespesaController,
  );

  // Exclui uma despesa.
  app.delete(
    "/despesas/:despesaId",
    {
      preHandler: [JWTVerify],
    },
    excluirDespesaController,
  );
}
