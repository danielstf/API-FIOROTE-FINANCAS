import { PerfilFinanceiro } from "@prisma/client";
import { prisma } from "../../../lib/prisma";

interface SalvarPerfilData {
  usuarioId: string;
  nome: string;
  avatar: string;
  tema: string;
}

interface AtualizarPerfilData {
  nome?: string;
  avatar?: string;
  tema?: string;
}

export class PerfilRepository {
  async countByUsuario(usuarioId: string) {
    return prisma.perfilFinanceiro.count({ where: { usuarioId } });
  }

  async listByUsuario(usuarioId: string): Promise<PerfilFinanceiro[]> {
    return prisma.perfilFinanceiro.findMany({
      where: { usuarioId },
      orderBy: { criadoEm: "asc" },
    });
  }

  async findByIdAndUsuario(perfilId: string, usuarioId: string) {
    return prisma.perfilFinanceiro.findFirst({ where: { id: perfilId, usuarioId } });
  }

  async create(data: SalvarPerfilData) {
    return prisma.perfilFinanceiro.create({ data });
  }

  async update(perfilId: string, data: AtualizarPerfilData) {
    return prisma.perfilFinanceiro.update({ where: { id: perfilId }, data });
  }

  async delete(perfilId: string, usuarioId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.despesa.deleteMany({
        where: {
          perfilFinanceiroId: perfilId,
          usuarioId,
        },
      });

      await tx.receita.deleteMany({
        where: {
          perfilFinanceiroId: perfilId,
          usuarioId,
        },
      });

      await tx.cartaoCredito.deleteMany({
        where: {
          perfilFinanceiroId: perfilId,
          usuarioId,
        },
      });

      await tx.perfilFinanceiro.delete({
        where: { id: perfilId },
      });
    });
  }
}
