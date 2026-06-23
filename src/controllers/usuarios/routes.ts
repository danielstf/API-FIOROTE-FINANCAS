import { FastifyInstance } from "fastify";
import { JWTVerify } from "../../middlewares/jwt-verify";
import { createUsuarioController } from "./create-usuario-controller";
import { atualizarPerfilController } from "./atualizar-perfil-controller";
import { loginUsuarioController } from "./login-usuario-controller";
import { loginGoogleController } from "./login-google-controller";
import { redefinirSenhaController } from "./redefinir-senha-controller";
import { solicitarRedefinicaoSenhaController } from "./solicitar-redefinicao-senha-controller";
import { trocarSenhaController } from "./trocar-senha-controller";
import { buscarPerfilController } from "./buscar-perfil-controller";
import { logoutController } from "./logout-controller";

export function usuariosRoutes(app: FastifyInstance) {
  app.post(
    "/usuarios",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "15 minutes",
        },
      },
    },
    createUsuarioController,
  );
  app.post(
    "/login",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "15 minutes",
        },
      },
    },
    loginUsuarioController,
  );
  app.post(
    "/login/google",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "15 minutes",
        },
      },
    },
    loginGoogleController,
  );
  app.post(
    "/esqueci-senha",
    {
      config: {
        rateLimit: {
          max: 3,
          timeWindow: "15 minutes",
        },
      },
    },
    solicitarRedefinicaoSenhaController,
  );
  app.post(
    "/redefinir-senha",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "15 minutes",
        },
      },
    },
    redefinirSenhaController,
  );
  app.get(
    "/usuarios/perfil",
    {
      preHandler: [JWTVerify],
    },
    buscarPerfilController,
  );
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
  app.post("/logout", logoutController);
}
