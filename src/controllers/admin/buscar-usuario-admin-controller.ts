import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { prisma } from "../../lib/prisma";

const querySchema = z.object({
  q: z.string().trim().min(1),
});

export async function buscarUsuarioAdminController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { q } = querySchema.parse(request.query);

  const usuarios = await prisma.usuario.findMany({
    where: {
      OR: [
        { nome: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 20,
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      nome: true,
      email: true,
      plano: true,
      role: true,
      criadoEm: true,
      premiumExpiraEm: true,
      exibirAnuncios: true,
      googleId: true,
      _count: {
        select: {
          despesas: true,
          receitas: true,
          perfisFinanceiros: true,
          cartoesCredito: true,
          pagamentosPremium: true,
        },
      },
      pagamentosPremium: {
        orderBy: { criadoEm: "desc" },
        take: 5,
        select: {
          id: true,
          tipo: true,
          status: true,
          valor: true,
          criadoEm: true,
        },
      },
    },
  });

  const resultado = usuarios.map((u) => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    plano: u.plano,
    role: u.role,
    criadoEm: u.criadoEm,
    premiumExpiraEm: u.premiumExpiraEm,
    exibirAnuncios: u.exibirAnuncios,
    loginGoogle: u.googleId !== null,
    contagens: u._count,
    pagamentos: u.pagamentosPremium.map((p) => ({
      ...p,
      valor: Number(p.valor),
    })),
  }));

  return reply.status(200).send({ usuarios: resultado });
}
