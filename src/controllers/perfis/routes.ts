import { FastifyInstance } from "fastify";
import { JWTVerify } from "../../middlewares/jwt-verify";
import { criarPerfilController } from "./criar-perfil-controller";
import { editarPerfilController } from "./editar-perfil-controller";
import { excluirPerfilController } from "./excluir-perfil-controller";
import { listarPerfisController } from "./listar-perfis-controller";

export function perfisRoutes(app: FastifyInstance) {
  app.get("/perfis", { preHandler: [JWTVerify] }, listarPerfisController);
  app.post("/perfis", { preHandler: [JWTVerify] }, criarPerfilController);
  app.put("/perfis/:perfilId", { preHandler: [JWTVerify] }, editarPerfilController);
  app.delete("/perfis/:perfilId", { preHandler: [JWTVerify] }, excluirPerfilController);
}