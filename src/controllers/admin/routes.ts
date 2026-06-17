import { FastifyInstance } from "fastify";
import { JWTVerify } from "../../middlewares/jwt-verify";
import { RoleVerify } from "../../middlewares/role-verify";
import { buscarUsuarioAdminController } from "./buscar-usuario-admin-controller";
import { resumoAdminController } from "./resumo-admin-controller";
import { pendentesController } from "./pendentes-controller";

export function adminRoutes(app: FastifyInstance) {
  app.get(
    "/admin/pendentes",
    { preHandler: [JWTVerify, RoleVerify("ADMIN")] },
    pendentesController,
  );
  app.get(
    "/admin/resumo",
    {
      preHandler: [JWTVerify, RoleVerify("ADMIN")],
    },
    resumoAdminController,
  );

  app.get(
    "/admin/usuarios/busca",
    {
      preHandler: [JWTVerify, RoleVerify("ADMIN")],
    },
    buscarUsuarioAdminController,
  );
}