import { FastifyInstance } from "fastify";
import { JWTVerify } from "../../middlewares/jwt-verify";
import { createUsuarioController } from "./create-usuario-controller";
import { atualizarPerfilController } from "./atualizar-perfil-controller";
import { loginUsuarioController } from "./login-usuario-controller";
import { loginGoogleController } from "./login-google-controller";
import { redefinirSenhaController } from "./redefinir-senha-controller";
import { solicitarRedefinicaoSenhaController } from "./solicitar-redefinicao-senha-controller";
import { trocarSenhaController } from "./trocar-senha-controller";

export function usuariosRoutes(app: FastifyInstance) {
  app.post("/usuarios", createUsuarioController);
  app.post("/login", loginUsuarioController);
  app.post("/login/google", loginGoogleController);
  app.post("/esqueci-senha", solicitarRedefinicaoSenhaController);
  app.post("/redefinir-senha", redefinirSenhaController);
  app.patch(
    "/usuarios/perfil",
    {
      preHandler: [JWTVerify],
    },
    atualizarPerfilController,
  );
  app.patch(
    "/usuarios/senha",
    {
      preHandler: [JWTVerify],
    },
    trocarSenhaController,
  );
}
