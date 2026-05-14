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
  app.post(
    "/usuarios",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
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
          max: 10,
          timeWindow: "1 minute",
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
          max: 20,
          timeWindow: "1 minute",
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
          max: 5,
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
          max: 10,
          timeWindow: "15 minutes",
        },
      },
    },
    redefinirSenhaController,
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
}
