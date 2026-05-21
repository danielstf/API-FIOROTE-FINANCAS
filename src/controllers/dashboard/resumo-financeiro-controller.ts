import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeResumoFinanceiroFactory } from "../../factory/dashboard-factory/resumo-financeiro-factory";
import { getPerfilFinanceiroId } from "../../lib/perfil-financeiro";
import { bloquearRecursoPremiumSeNecessario } from "../../lib/premium-access";
import { booleanQuery } from "../../lib/query";
import { MesReceitaInvalidoError } from "../../use-cases/receitas/receita-mes";

const resumoFinanceiroQuerySchema = z.object({
  // Mes base do dashboard no formato YYYY-MM.
  mes: z.string().trim().min(1, "O mes e obrigatorio"),
  meses: z.coerce.number().int().positive().optional().default(6),
  relatorio: booleanQuery,
});

export async function resumoFinanceiroController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { mes, meses, relatorio } = resumoFinanceiroQuerySchema.parse(request.query);

  try {
    if (
      await bloquearRecursoPremiumSeNecessario(
        request.user.sub,
        relatorio,
        reply,
      )
    ) {
      return;
    }

    const resumoFinanceiro = makeResumoFinanceiroFactory();

    const resultado = await resumoFinanceiro.execute({
      usuarioId: request.user.sub,
      perfilFinanceiroId: getPerfilFinanceiroId(request),
      mes,
      meses,
    });

    return reply.status(200).send(resultado);
  } catch (error) {
    if (error instanceof MesReceitaInvalidoError) {
      return reply.status(400).send({ message: error.message });
    }

    console.error("Erro ao gerar resumo financeiro:", error);
    return reply.status(500).send({ message: "Erro ao gerar resumo financeiro" });
  }
}
