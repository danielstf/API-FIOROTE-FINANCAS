import { FastifyInstance } from "fastify";
import { JWTVerify } from "../../middlewares/jwt-verify";
import { RoleVerify } from "../../middlewares/role-verify";
import { criarContatoController } from "./criar-contato-controller";
import { listarContatosController } from "./listar-contatos-controller";
import { finalizarContatoController } from "./finalizar-contato-controller";
import { excluirContatoController } from "./excluir-contato-controller";

export function contatosRoutes(app: FastifyInstance) {
  // Público — sem autenticação
  app.post("/contatos", {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "15 minutes",
      },
    },
  }, criarContatoController);

  // Admin only
  app.get("/contatos", { preHandler: [JWTVerify, RoleVerify("ADMIN")] }, listarContatosController);
  app.patch("/contatos/:contatoId/finalizar", { preHandler: [JWTVerify, RoleVerify("ADMIN")] }, finalizarContatoController);
  app.delete("/contatos/:contatoId", { preHandler: [JWTVerify, RoleVerify("ADMIN")] }, excluirContatoController);
}
