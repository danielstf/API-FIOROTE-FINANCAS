import { Despesa, FormaPagamentoDespesa } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { DespesaRepositoryInterface } from "../../interface/despesas/despesa-repo-interface";

const renovacoesRecorrencia = new Map<string, number>();

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
                // Despesas avulsas, parceladas e fixas novo estilo (mesReferencia explícito).
                {
                  parcelamentoId: { not: null },
                  mesReferencia: { gte: dataInicio, lt: dataFim },
                },
                {
                  fixa: false,
                  parcelamentoId: null,
                  mesReferencia: { gte: dataInicio, lt: dataFim },
                },
                // Despesas fixas legadas (recorrência, sem parcelamentoId individual).
                {
                  fixa: true,
                  parcelamentoId: null,
                  mesReferencia: { lt: dataFim },
                  OR: [
                    { recorrenciaFim: null },
                    { recorrenciaFim: { gt: dataInicio } },
                  ],
                  excecoesRecorrencia: {
                    none: {
                      usuarioId,
                      mesReferencia: { gte: dataInicio, lt: dataFim },
                    },
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
      where: { parcelamentoId, usuarioId },
    });
  }

  // Exclui registros do mesmo parcelamento a partir de um mês (inclusive).
  async deleteByParcelamentoFromMes(
    parcelamentoId: string,
    usuarioId: string,
    fromMes: Date,
  ): Promise<void> {
    await prisma.despesa.deleteMany({
      where: {
        parcelamentoId,
        usuarioId,
        mesReferencia: { gte: fromMes },
      },
    });
  }

  // Atualiza campos de todos os registros do mesmo parcelamento a partir de um mês.
  async updateManyByParcelamentoFromMes(
    parcelamentoId: string,
    usuarioId: string,
    fromMes: Date,
    data: AtualizarDespesaData,
  ): Promise<void> {
    await prisma.despesa.updateMany({
      where: {
        parcelamentoId,
        usuarioId,
        mesReferencia: { gte: fromMes },
      },
      data,
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
  const agora = new Date();
  const mesAtual = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1));

  const chave = `${usuarioId}:${perfilFinanceiroId ?? "sem-perfil"}:${mesAtual.toISOString()}`;

  // Cache em memória com TTL de 1 hora — resiste a múltiplas chamadas na mesma sessão
  // mas expira naturalmente em caso de reinício do servidor dentro do mesmo mês
  const agora_ms = Date.now();
  const TTL_MS = 60 * 60 * 1000; // 1 hora
  const ultimaRenovacao = renovacoesRecorrencia.get(chave);
  if (ultimaRenovacao && agora_ms - ultimaRenovacao < TTL_MS) {
    return;
  }

  const horizonte = new Date(mesAtual);
  horizonte.setUTCMonth(horizonte.getUTCMonth() + 12);

  // Estende apenas despesas fixas que estejam a menos de 2 meses do fim da recorrência,
  // evitando extensões desnecessárias em despesas com horizonte já longo
  const limiteExtensao = new Date(mesAtual);
  limiteExtensao.setUTCMonth(limiteExtensao.getUTCMonth() + 2);

  await prisma.despesa.updateMany({
    where: {
      usuarioId,
      perfilFinanceiroId: perfilFinanceiroId ?? null,
      fixa: true,
      recorrenciaEncerrada: false,
      recorrenciaFim: {
        gte: mesAtual,
        lt: limiteExtensao,
      },
    },
    data: {
      recorrenciaFim: horizonte,
    },
  });

  renovacoesRecorrencia.set(chave, agora_ms);
}
