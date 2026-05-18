import { FastifyInstance } from "fastify";
import { JWTVerify } from "../../middlewares/jwt-verify";
import { RoleVerify } from "../../middlewares/role-verify";
import { criarSugestaoController } from "./criar-sugestao-controller";
import { excluirSugestaoController } from "./excluir-sugestao-controller";
import { finalizarSugestaoController } from "./finalizar-sugestao-controller";
import { listarSugestoesController } from "./listar-sugestoes-controller";

export function sugestoesRoutes(app: FastifyInstance) {
  app.post(
    "/sugestoes",
    {
      preHandler: [JWTVerify],
    },
    criarSugestaoController,
  );

  app.get(
    "/sugestoes",
    {
      preHandler: [JWTVerify, RoleVerify("ADMIN")],
    },
    listarSugestoesController,
  );

  app.patch(
    "/sugestoes/:sugestaoId/finalizar",
    {
      preHandler: [JWTVerify, RoleVerify("ADMIN")],
    },
    finalizarSugestaoController,
  );

  app.delete(
    "/sugestoes/:sugestaoId",
    {
      preHandler: [JWTVerify, RoleVerify("ADMIN")],
    },
    excluirSugestaoController,
  );
}
