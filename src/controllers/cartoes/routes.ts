import { FastifyInstance } from "fastify";
import { JWTVerify } from "../../middlewares/jwt-verify";
import { criarCartaoController } from "./criar-cartao-controller";
import { editarCartaoController } from "./editar-cartao-controller";
import { excluirCartaoController } from "./excluir-cartao-controller";
import { listarCartoesController } from "./listar-cartoes-controller";

export function cartoesRoutes(app: FastifyInstance) {
  // Lista cartoes cadastrados para uso no select de despesas.
  app.get(
    "/cartoes",
    {
      preHandler: [JWTVerify],
    },
    listarCartoesController,
  );

  // Cadastra um novo cartao, como Nubank, Inter ou Itau.
  app.post(
    "/cartoes",
    {
      preHandler: [JWTVerify],
    },
    criarCartaoController,
  );

  // Edita o nome de um cartao.
  app.put(
    "/cartoes/:cartaoId",
    {
      preHandler: [JWTVerify],
    },
    editarCartaoController,
  );

  // Exclui um cartao cadastrado.
  app.delete(
    "/cartoes/:cartaoId",
    {
      preHandler: [JWTVerify],
    },
    excluirCartaoController,
  );
}
