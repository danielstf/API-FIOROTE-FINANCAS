import { Despesa, FormaPagamentoDespesa } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { DespesaRepositoryInterface } from "../../interface/despesas/despesa-repo-interface";

const renovacoesRecorrencia = new Set<string>();

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
  recorrenciaFim?: Date | null;
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
  recorrenciaFim?: Date | null;
  recorrenciaEncerrada?: boolean;
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
    const despesas = await prisma.$transaction(
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
    perfilFinanceiroId,
    formaPagamento,
    cartaoCreditoId,
    dataInicio,
    dataFim,
    somenteVencidas,
    paga,
  }: ListarPorUsuarioParams): Promise<Despesa[]> {
    await renovarRecorrenciasFixas(usuarioId, perfilFinanceiroId);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const despesas = await prisma.despesa.findMany({
      where: {
        usuarioId,
        perfilFinanceiroId: perfilFinanceiroId ?? null,
        formaPagamento,
        cartaoCreditoId,
        paga,
        OR:
          dataInicio && dataFim
            ? [
                {
                  fixa: false,
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
                  OR: [
                    { recorrenciaFim: null },
                    {
                      recorrenciaFim: {
                        gt: dataInicio,
                      },
                    },
                  ],
                  excecoesRecorrencia: {
                    none: {
                      usuarioId,
                      mesReferencia: {
                        gte: dataInicio,
                        lt: dataFim,
                      },
                    },
                  },
                },
              ]
            : undefined,
        AND:
          dataInicio && dataFim
            ? [
                {
                  OR: [
                    { fixa: false },
                    {
                      excecoesRecorrencia: {
                        none: {
                          usuarioId,
                          mesReferencia: {
                            gte: dataInicio,
                            lt: dataFim,
                          },
                        },
                      },
                    },
                  ],
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

  // Exclui a despesa fixa e todas as suas excecoes de recorrencia em uma transacao.
  async deleteComExcecoes(despesaId: string): Promise<void> {
    await prisma.$transaction([
      prisma.despesaExcecaoRecorrencia.deleteMany({ where: { despesaId } }),
      prisma.despesa.delete({ where: { id: despesaId } }),
    ]);
  }

  // Oculta uma recorrencia fixa apenas no mes selecionado.
  async createExcecaoRecorrencia(
    despesaId: string,
    usuarioId: string,
    mesReferencia: Date,
  ): Promise<void> {
    await prisma.despesaExcecaoRecorrencia.upsert({
      where: {
        despesaId_usuarioId_mesReferencia: {
          despesaId,
          usuarioId,
          mesReferencia,
        },
      },
      update: {},
      create: {
        despesaId,
        usuarioId,
        mesReferencia,
      },
    });
  }
}

async function renovarRecorrenciasFixas(
  usuarioId: string,
  perfilFinanceiroId?: string | null,
) {
  const mesAtual = new Date();
  mesAtual.setDate(1);
  mesAtual.setHours(0, 0, 0, 0);

  const chave = `${usuarioId}:${perfilFinanceiroId ?? "sem-perfil"}:${mesAtual.toISOString()}`;

  if (renovacoesRecorrencia.has(chave)) {
    return;
  }

  const horizonte = new Date(mesAtual);
  horizonte.setMonth(horizonte.getMonth() + 12);

  await prisma.despesa.updateMany({
    where: {
      usuarioId,
      perfilFinanceiroId: perfilFinanceiroId ?? null,
      fixa: true,
      recorrenciaEncerrada: false,
      recorrenciaFim: {
        gte: mesAtual,
        lt: horizonte,
      },
    },
    data: {
      recorrenciaFim: horizonte,
    },
  });

  renovacoesRecorrencia.add(chave);
}
