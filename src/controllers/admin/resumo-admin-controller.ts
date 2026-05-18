import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../../lib/prisma";

export async function resumoAdminController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const [totalUsuarios, usuariosPremium, usuariosFree, totalReceitas, totalDespesas, totalPerfis, ultimosUsuarios] = await Promise.all([
    prisma.usuario.count(),
    prisma.usuario.count({ where: { plano: "PREMIUM" } }),
    prisma.usuario.count({ where: { plano: "FREE" } }),
    prisma.receita.count(),
    prisma.despesa.count(),
    prisma.perfilFinanceiro.count(),
    prisma.usuario.findMany({
      orderBy: { criadoEm: "desc" },
      take: 8,
      select: { id: true, nome: true, email: true, plano: true, role: true, criadoEm: true },
    }),
  ]);

  return reply.status(200).send({
    usuarios: {
      total: totalUsuarios,
      premium: usuariosPremium,
      free: usuariosFree,
    },
    perfis: {
      total: totalPerfis,
    },
    movimentos: {
      receitas: totalReceitas,
      despesas: totalDespesas,
    },
    simultaneos: {
      atual: null,
      observacao: "A API usa JWT stateless; para simultaneos reais e necessario registrar sessoes ativas ou heartbeats.",
    },
    ultimosUsuarios,
  });
}