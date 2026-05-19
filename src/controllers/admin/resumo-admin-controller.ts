import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../../lib/prisma";

export async function resumoAdminController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const onlineDesde = new Date(Date.now() - 1000 * 60 * 5);
  const [
    totalUsuarios,
    usuariosPremium,
    usuariosFree,
    totalReceitas,
    totalDespesas,
    totalPerfis,
    usuariosSimultaneos,
    ultimosUsuarios,
  ] = await Promise.all([
    prisma.usuario.count(),
    prisma.usuario.count({ where: { plano: "PREMIUM" } }),
    prisma.usuario.count({ where: { plano: "FREE" } }),
    prisma.receita.count(),
    prisma.despesa.count(),
    prisma.perfilFinanceiro.count(),
    prisma.sessaoUsuario.findMany({
      where: {
        atualizadaEm: {
          gte: onlineDesde,
        },
        expiraEm: {
          gt: new Date(),
        },
      },
      distinct: ["usuarioId"],
      select: {
        usuarioId: true,
      },
    }),
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
      atual: usuariosSimultaneos.length,
      janelaMinutos: 5,
      observacao:
        "Usuarios com sessao ativa e heartbeat registrado nos ultimos 5 minutos.",
    },
    ultimosUsuarios,
  });
}
