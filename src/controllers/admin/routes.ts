import { FastifyInstance } from "fastify";
import { JWTVerify } from "../../middlewares/jwt-verify";
import { RoleVerify } from "../../middlewares/role-verify";
import { resumoAdminController } from "./resumo-admin-controller";

export function adminRoutes(app: FastifyInstance) {
  app.get(
    "/admin/resumo",
    {
      preHandler: [JWTVerify, RoleVerify("ADMIN")],
    },
    resumoAdminController,
  );
}