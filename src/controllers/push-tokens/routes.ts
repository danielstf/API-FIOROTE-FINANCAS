import { FastifyInstance } from "fastify";
import { JWTVerify } from "../../middlewares/jwt-verify";
import { registrarPushTokenController } from "./registrar-push-token-controller";

export function pushTokensRoutes(app: FastifyInstance) {
  app.post(
    "/dispositivos/push-token",
    { preHandler: [JWTVerify] },
    registrarPushTokenController,
  );
}
