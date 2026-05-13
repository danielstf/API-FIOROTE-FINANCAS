import { FastifyInstance } from "fastify";
import { JWTVerify } from "../../middlewares/jwt-verify";
import { resumoFinanceiroController } from "./resumo-financeiro-controller";

export function dashboardRoutes(app: FastifyInstance) {
  // Resumo mensal acumulativo e dados prontos para graficos do dashboard.
  app.get(
    "/dashboard/resumo-financeiro",
    {
      preHandler: [JWTVerify],
    },
    resumoFinanceiroController,
  );
}
