import { Despesa, FormaPagamentoDespesa } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { DespesaRepositoryInterface } from "../../interface/despesas/despesa-repo-interface";

interface CriarDespesaData {
  usuarioId: string;
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
  // Cria uma nova despesa vinculada ao usuario.
  async create(data: CriarDespesaData): Promise<Despesa> {
    const despesa = await prisma.despesa.create({
      data,
    });

    return despesa;
  }

  // Cria despesas em lote, uma por mes quando houver parcelamento.
  async createMany(data: CriarDespesaData[]): Promise<Despesa[]> {
    const despesas = await Promise.all(
      data.map((despesa) =>
        prisma.despesa.create({
          data: despesa,
        }),
      ),
    );

    return despesas;
  }

  // Lista despesas do usuario, incluindo filtro por forma, vencidas e status pago.
  async listByUsuario({
    usuarioId,
    formaPagamento,
    cartaoCreditoId,
    dataInicio,
    dataFim,
    somenteVencidas,
    paga,
  }: ListarPorUsuarioParams): Promise<Despesa[]> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const despesas = await prisma.despesa.findMany({
      where: {
        usuarioId,
        formaPagamento,
        cartaoCreditoId,
        paga,
        OR:
          dataInicio && dataFim
            ? [
                {
                  mesReferencia: {
                    gte: dataInicio,
                    lt: dataFim,
                  },
                },
                {
                  fixa: true,
                  mesReferencia: {
                    lt: dataFim,
                  },
                },
              ]
            : undefined,
        dataVencimento: somenteVencidas
          ? {
              lt: hoje,
            }
          : undefined,
      },
      include: {
        cartaoCredito: true,
      },
      orderBy: [{ paga: "asc" }, { dataVencimento: "asc" }, { criadoEm: "desc" }],
    });

    return despesas;
  }

  // Busca a despesa pelo id e pelo dono para proteger dados de outro usuario.
  async findByIdAndUsuario(
    despesaId: string,
    usuarioId: string,
  ): Promise<Despesa | null> {
    const despesa = await prisma.despesa.findFirst({
      where: {
        id: despesaId,
        usuarioId,
      },
      include: {
        cartaoCredito: true,
      },
    });

    return despesa;
  }

  // Atualiza os campos informados da despesa.
  async update(despesaId: string, data: AtualizarDespesaData): Promise<Despesa> {
    const despesa = await prisma.despesa.update({
      where: { id: despesaId },
      data,
      include: {
        cartaoCredito: true,
      },
    });

    return despesa;
  }

  // Exclui a despesa pelo id.
  async delete(despesaId: string): Promise<void> {
    await prisma.despesa.delete({
      where: { id: despesaId },
    });
  }

  // Exclui todas as parcelas de um mesmo parcelamento do usuario.
  async deleteByParcelamento(
    parcelamentoId: string,
    usuarioId: string,
  ): Promise<void> {
    await prisma.despesa.deleteMany({
      where: {
        parcelamentoId,
        usuarioId,
      },
    });
  }
}
