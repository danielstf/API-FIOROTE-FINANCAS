import { Despesa, FormaPagamentoDespesa } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { DespesaRepositoryInterface } from "../../interface/despesas/despesa-repo-interface";

interface CriarDespesaData {
  usuarioId: string;
  perfilFinanceiroId?: string | null;
  descricao: string;
  valor: number;
  categoriaNome?: string | null;
  formaPagamento: FormaPagamentoDespesa;
  cartaoCreditoId?: string | null;
  mesReferencia: Date;
  dataVencimento?: Date | null;
  fixa?: boolean;
  numeroParcelas?: number | null;
  parcelaAtual?: number | null;
  parcelamentoId?: string | null;
}

interface ListarPorUsuarioParams {
  usuarioId: string;
  perfilFinanceiroId?: string | null;
  formaPagamento?: FormaPagamentoDespesa;
  cartaoCreditoId?: string;
  dataInicio?: Date;
  dataFim?: Date;
  somenteVencidas?: boolean;
  paga?: boolean;
}

interface AtualizarDespesaData {
  descricao?: string;
  valor?: number;
  categoriaNome?: string | null;
  formaPagamento?: FormaPagamentoDespesa;
  cartaoCreditoId?: string | null;
  mesReferencia?: Date;
  dataVencimento?: Date | null;
  paga?: boolean;
  dataPagamento?: Date | null;
  fixa?: boolean;
  numeroParcelas?: number | null;
  parcelaAtual?: number | null;
  parcelamentoId?: string | null;
}

export class DespesaRepository implements DespesaRepositoryInterface {
  async create(data: CriarDespesaData): Promise<Despesa> {
    return prisma.despesa.create({ data });
  }

  async createMany(data: CriarDespesaData[]): Promise<Despesa[]> {
    return prisma.$transaction(
      data.map((despesa) => prisma.despesa.create({ data: despesa })),
    );
  }

  async listByUsuario({
    usuarioId,
    perfilFinanceiroId,
    formaPagamento,
    cartaoCreditoId,
    dataInicio,
    dataFim,
    somenteVencidas,
    paga,
  }: ListarPorUsuarioParams): Promise<Despesa[]> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return prisma.despesa.findMany({
      where: {
        usuarioId,
        perfilFinanceiroId: perfilFinanceiroId ?? null,
        formaPagamento,
        cartaoCreditoId,
        paga,
        OR:
          dataInicio && dataFim
            ? [
                { parcelamentoId: { not: null }, mesReferencia: { gte: dataInicio, lt: dataFim } },
                { fixa: false, parcelamentoId: null, mesReferencia: { gte: dataInicio, lt: dataFim } },
              ]
            : undefined,
        dataVencimento: somenteVencidas ? { lt: hoje } : undefined,
      },
      include: { cartaoCredito: true },
      orderBy: [{ paga: "asc" }, { dataVencimento: "asc" }, { criadoEm: "desc" }],
    });
  }

  async findByIdAndUsuario(despesaId: string, usuarioId: string): Promise<Despesa | null> {
    return prisma.despesa.findFirst({
      where: { id: despesaId, usuarioId },
      include: { cartaoCredito: true },
    });
  }

  async update(despesaId: string, data: AtualizarDespesaData): Promise<Despesa> {
    return prisma.despesa.update({
      where: { id: despesaId },
      data,
      include: { cartaoCredito: true },
    });
  }

  async delete(despesaId: string): Promise<void> {
    await prisma.despesa.delete({ where: { id: despesaId } });
  }

  async deleteByParcelamento(parcelamentoId: string, usuarioId: string): Promise<void> {
    await prisma.despesa.deleteMany({ where: { parcelamentoId, usuarioId } });
  }

  async deleteByParcelamentoFromMes(
    parcelamentoId: string,
    usuarioId: string,
    fromMes: Date,
  ): Promise<void> {
    await prisma.despesa.deleteMany({
      where: { parcelamentoId, usuarioId, mesReferencia: { gte: fromMes } },
    });
  }

  async updateManyByParcelamentoFromMes(
    parcelamentoId: string,
    usuarioId: string,
    fromMes: Date,
    data: AtualizarDespesaData,
  ): Promise<void> {
    await prisma.despesa.updateMany({
      where: { parcelamentoId, usuarioId, mesReferencia: { gte: fromMes } },
      data,
    });
  }
}
