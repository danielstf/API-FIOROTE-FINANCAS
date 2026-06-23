import { prisma } from "./prisma";
import { randomUUID } from "node:crypto";

function somarMesesUtc(base: Date, n: number): Date {
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + n, 1));
  return d;
}

function somarMesesVencimento(base: Date, n: number): Date {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + n, base.getUTCDate()));
}

/**
 * Converte todos os itens fixos legados (fixa=true, parcelamentoId=null) para o
 * novo formato de 60 registros individuais agrupados por parcelamentoId.
 * Executa uma única vez na inicialização — é idempotente pois apaga o registro
 * legado ao final, então na segunda execução não há nada a converter.
 */
export async function migrarFixasLegadas() {
  // ── Despesas ──────────────────────────────────────────────────────────────
  const despesasLegadas = await prisma.despesa.findMany({
    where: { fixa: true, parcelamentoId: null },
    include: { excecoesRecorrencia: { select: { mesReferencia: true } } },
  });

  if (despesasLegadas.length === 0 && (await prisma.receita.count({ where: { fixa: true, parcelamentoId: null } })) === 0) {
    return;
  }

  console.log(`[migração] ${despesasLegadas.length} despesa(s) legada(s) encontrada(s).`);

  let despesasConvertidas = 0;
  let despesasRemovidas = 0;

  for (const d of despesasLegadas) {
    try {
      if (d.recorrenciaEncerrada) {
        await prisma.$transaction([
          prisma.despesaExcecaoRecorrencia.deleteMany({ where: { despesaId: d.id } }),
          prisma.despesa.delete({ where: { id: d.id } }),
        ]);
        despesasRemovidas++;
        continue;
      }

      const grupoId = randomUUID();
      const excecaoMeses = new Set(
        d.excecoesRecorrencia.map((e) => e.mesReferencia.getTime()),
      );

      const mesOrigem = new Date(Date.UTC(
        d.mesReferencia.getUTCFullYear(),
        d.mesReferencia.getUTCMonth(),
        1,
      ));

      const registros = Array.from({ length: 60 }, (_, i) => {
        const mes = somarMesesUtc(mesOrigem, i);
        if (d.recorrenciaFim && mes >= d.recorrenciaFim) return null;
        if (excecaoMeses.has(mes.getTime())) return null;

        return {
          id: randomUUID(),
          usuarioId: d.usuarioId,
          perfilFinanceiroId: d.perfilFinanceiroId,
          descricao: d.descricao,
          valor: d.valor,
          categoriaNome: d.categoriaNome,
          formaPagamento: d.formaPagamento,
          cartaoCreditoId: d.cartaoCreditoId,
          categoriaId: d.categoriaId,
          mesReferencia: mes,
          dataVencimento: d.dataVencimento ? somarMesesVencimento(d.dataVencimento, i) : null,
          fixa: true as const,
          parcelamentoId: grupoId,
          numeroParcelas: null,
          parcelaAtual: null,
          paga: false as const,
          dataPagamento: null,
          recorrenciaFim: null,
          recorrenciaEncerrada: false as const,
        };
      }).filter((r): r is NonNullable<typeof r> => r !== null);

      await prisma.$transaction(async (tx) => {
        if (registros.length > 0) {
          await tx.despesa.createMany({ data: registros });
        }
        await tx.despesaExcecaoRecorrencia.deleteMany({ where: { despesaId: d.id } });
        await tx.despesa.delete({ where: { id: d.id } });
      });

      despesasConvertidas++;
    } catch (err) {
      console.error(`[migração] Erro ao converter despesa ${d.id}:`, err);
    }
  }

  // ── Receitas ──────────────────────────────────────────────────────────────
  const receitasLegadas = await prisma.receita.findMany({
    where: { fixa: true, parcelamentoId: null },
    include: { excecoesRecorrencia: { select: { mesReferencia: true } } },
  });

  console.log(`[migração] ${receitasLegadas.length} receita(s) legada(s) encontrada(s).`);

  let receitasConvertidas = 0;
  let receitasRemovidas = 0;

  for (const r of receitasLegadas) {
    try {
      if (r.recorrenciaEncerrada) {
        await prisma.$transaction([
          prisma.receitaExcecaoRecorrencia.deleteMany({ where: { receitaId: r.id } }),
          prisma.receita.delete({ where: { id: r.id } }),
        ]);
        receitasRemovidas++;
        continue;
      }

      const grupoId = randomUUID();
      const excecaoMeses = new Set(
        r.excecoesRecorrencia.map((e) => e.mesReferencia.getTime()),
      );

      const mesOrigem = new Date(Date.UTC(
        r.data.getUTCFullYear(),
        r.data.getUTCMonth(),
        1,
      ));

      const registros = Array.from({ length: 60 }, (_, i) => {
        const mes = somarMesesUtc(mesOrigem, i);
        if (r.recorrenciaFim && mes >= r.recorrenciaFim) return null;
        if (excecaoMeses.has(mes.getTime())) return null;

        return {
          id: randomUUID(),
          usuarioId: r.usuarioId,
          perfilFinanceiroId: r.perfilFinanceiroId,
          descricao: r.descricao,
          valor: r.valor,
          categoriaId: r.categoriaId,
          data: mes,
          fixa: true as const,
          parcelamentoId: grupoId,
          numeroParcelas: null,
          parcelaAtual: null,
          recorrenciaFim: null,
          recorrenciaEncerrada: false as const,
        };
      }).filter((r): r is NonNullable<typeof r> => r !== null);

      await prisma.$transaction(async (tx) => {
        if (registros.length > 0) {
          await tx.receita.createMany({ data: registros });
        }
        await tx.receitaExcecaoRecorrencia.deleteMany({ where: { receitaId: r.id } });
        await tx.receita.delete({ where: { id: r.id } });
      });

      receitasConvertidas++;
    } catch (err) {
      console.error(`[migração] Erro ao converter receita ${r.id}:`, err);
    }
  }

  console.log(`[migração] Despesas: ${despesasConvertidas} convertidas, ${despesasRemovidas} removidas.`);
  console.log(`[migração] Receitas: ${receitasConvertidas} convertidas, ${receitasRemovidas} removidas.`);
}
