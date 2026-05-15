import { FastifyInstance } from "fastify";
import { JWTVerify } from "../../middlewares/jwt-verify";
import { RoleVerify } from "../../middlewares/role-verify";
import { criarSugestaoController } from "./criar-sugestao-controller";
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
}
