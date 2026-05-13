import { FastifyInstance } from "fastify";
import { JWTVerify } from "../../middlewares/jwt-verify";
import { criarReceitaController } from "./criar-receita-controller";
import { editarReceitaController } from "./editar-receita-controller";
import { excluirReceitaController } from "./excluir-receita-controller";
import { listarOpcoesReceitaController } from "./listar-opcoes-receita-controller";
import { listarReceitasController } from "./listar-receitas-controller";
import { obterReceitaController } from "./obter-receita-controller";

export function receitasRoutes(app: FastifyInstance) {
  // Opcoes padrao para preencher o campo nome no cadastro de receita.
  app.get(
    "/receitas/opcoes",
    {
      preHandler: [JWTVerify],
    },
    listarOpcoesReceitaController,
  );

  // Lista receitas do usuario logado, com filtro opcional por mes.
  app.get(
    "/receitas",
    {
      preHandler: [JWTVerify],
    },
    listarReceitasController,
  );

  // Visualiza uma receita especifica do usuario logado.
  app.get(
    "/receitas/:receitaId",
    {
      preHandler: [JWTVerify],
    },
    obterReceitaController,
  );

  // Cadastra uma nova receita para o usuario logado.
  app.post(
    "/receitas",
    {
      preHandler: [JWTVerify],
    },
    criarReceitaController,
  );

  // Edita nome, valor e/ou mes de uma receita do usuario logado.
  app.put(
    "/receitas/:receitaId",
    {
      preHandler: [JWTVerify],
    },
    editarReceitaController,
  );

  // Exclui uma receita do usuario logado.
  app.delete(
    "/receitas/:receitaId",
    {
      preHandler: [JWTVerify],
    },
    excluirReceitaController,
  );
}
