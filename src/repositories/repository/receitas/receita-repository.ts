import { prisma } from "../../../lib/prisma";
import { Receita } from "@prisma/client";
import { ReceitaRepositoryInterface } from "../../interface/receitas/receita-repo-interface";

interface CriarReceitaData {
  usuarioId: string;
  perfilFinanceiroId?: string | null;
  descricao: string;
  valor: number;
  data: Date;
  fixa?: boolean;
  numeroParcelas?: number | null;
  parcelaAtual?: number | null;
  parcelamentoId?: string | null;
}

interface ListarPorUsuarioParams {
  usuarioId: string;
  perfilFinanceiroId?: string | null;
  dataInicio?: Date;
  dataFim?: Date;
}

interface AtualizarReceitaData {
  descricao?: string;
  valor?: number;
  data?: Date;
  fixa?: boolean;
  numeroParcelas?: number | null;
  parcelaAtual?: number | null;
  parcelamentoId?: string | null;
}

export class ReceitaRepository implements ReceitaRepositoryInterface {
  async create(data: CriarReceitaData): Promise<Receita> {
    return prisma.receita.create({ data });
  }

  async createMany(data: CriarReceitaData[]): Promise<Receita[]> {
    return prisma.$transaction(
      data.map((receita) => prisma.receita.create({ data: receita })),
    );
  }

  async listByUsuario({
    usuarioId,
    perfilFinanceiroId,
    dataInicio,
    dataFim,
  }: ListarPorUsuarioParams): Promise<Receita[]> {
    return prisma.receita.findMany({
      where: {
        usuarioId,
        perfilFinanceiroId: perfilFinanceiroId ?? null,
        OR:
          dataInicio && dataFim
            ? [
                { parcelamentoId: { not: null }, data: { gte: dataInicio, lt: dataFim } },
                { fixa: false, parcelamentoId: null, data: { gte: dataInicio, lt: dataFim } },
              ]
            : undefined,
      },
      orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
    });
  }

  async findByIdAndUsuario(receitaId: string, usuarioId: string): Promise<Receita | null> {
    return prisma.receita.findFirst({ where: { id: receitaId, usuarioId } });
  }

  async update(receitaId: string, data: AtualizarReceitaData): Promise<Receita> {
    return prisma.receita.update({ where: { id: receitaId }, data });
  }

  async delete(receitaId: string): Promise<void> {
    await prisma.receita.delete({ where: { id: receitaId } });
  }

  async deleteByParcelamento(parcelamentoId: string, usuarioId: string): Promise<void> {
    await prisma.receita.deleteMany({ where: { parcelamentoId, usuarioId } });
  }

  async deleteByParcelamentoFromMes(
    parcelamentoId: string,
    usuarioId: string,
    fromMes: Date,
  ): Promise<void> {
    await prisma.receita.deleteMany({
      where: { parcelamentoId, usuarioId, data: { gte: fromMes } },
    });
  }

  async updateManyByParcelamentoFromMes(
    parcelamentoId: string,
    usuarioId: string,
    fromMes: Date,
    data: AtualizarReceitaData,
  ): Promise<void> {
    await prisma.receita.updateMany({
      where: { parcelamentoId, usuarioId, data: { gte: fromMes } },
      data,
    });
  }
}
