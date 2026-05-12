import { FastifyInstance } from "fastify";
import { createUsuarioController } from "./create-usuario-controller";
import { loginUsuarioController } from "./login-usuario-controller";

export function usuariosRoutes(app: FastifyInstance) {
  app.post("/usuarios", createUsuarioController);
  app.post("/login", loginUsuarioController);
}
