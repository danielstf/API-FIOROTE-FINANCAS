import { Despesa, Receita } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { DespesaRepositoryInterface } from "../../repositories/interface/despesas/despesa-repo-interface";
import { ReceitaRepositoryInterface } from "../../repositories/interface/receitas/receita-repo-interface";
import {
  criarDataDoMes,
  criarIntervaloDoMes,
  formatarMesReceita,
  somarMeses,
} from "../receitas/receita-mes";
import { despesaEstaVencida } from "../despesas/despesa-dados";

interface ResumoFinanceiroUseCaseRequest {
  usuarioId: string;
  perfilFinanceiroId?: string | null;
  mes: string;
  meses: number;
}

interface MovimentoMensal {
  mes: string;
  receitas: number;
  despesas: number;
  saldoInicial: number;
  saldoFinal: number;
}

function somarReceitas(receitas: Receita[]) {
  return receitas.reduce((total, receita) => total + Number(receita.valor), 0);
}

function somarDespesas(despesas: Despesa[]) {
  return despesas.reduce((total, despesa) => total + Number(despesa.valor), 0);
}

export class ResumoFinanceiroUseCase {
  private receitasPorMes = new Map<string, Promise<Receita[]>>();
  private despesasPorMes = new Map<string, Promise<Despesa[]>>();

  constructor(
    private receitaRepository: ReceitaRepositoryInterface,
    private despesaRepository: DespesaRepositoryInterface,
  ) {}

  async execute({
    usuarioId,
    perfilFinanceiroId,
    mes,
    meses,
  }: ResumoFinanceiroUseCaseRequest) {
    const mesAtual = criarDataDoMes(mes);
    const quantidadeMeses = Math.min(Math.max(meses, 1), 24);
    const primeiroMesGrafico = somarMeses(mesAtual, -(quantidadeMeses - 1));

    const saldoInicial = await this.calcularSaldoAteMes(
      usuarioId,
      perfilFinanceiroId,
      mesAtual,
    );
    const resumoMes = await this.calcularResumoDoMes(
      usuarioId,
      perfilFinanceiroId,
      mesAtual,
      saldoInicial,
    );
    const evolucao = await this.calcularEvolucao(
      usuarioId,
      perfilFinanceiroId,
      primeiroMesGrafico,
      quantidadeMeses,
    );

    const todasDespesasDoPeriodo = await this.buscarTodasDespesasDoPeriodo(
      usuarioId,
      perfilFinanceiroId,
      primeiroMesGrafico,
      quantidadeMeses,
    );

    return {
      mes,
      resumo: resumoMes,
      graficos: {
        pizzaDespesasPorCategoria: this.montarPizzaCategorias(todasDespesasDoPeriodo),
        barrasMaioresGastos: this.montarMaioresGastos(todasDespesasDoPeriodo),
        linhaEvolucaoFinanceira: evolucao,
        linhaEvolucaoGastos: evolucao.map((item) => ({
          mes: item.mes,
          totalDespesas: item.despesas,
        })),
      },
    };
  }

  private async calcularSaldoAteMes(
    usuarioId: string,
    perfilFinanceiroId: string | null | undefined,
    mesLimite: Date,
  ) {
    let saldo = 0;
    const mesCursor = await this.buscarPrimeiroMesComMovimento(
      usuarioId,
      perfilFinanceiroId,
      mesLimite,
    );

    while (mesCursor < mesLimite) {
      const intervalo = criarIntervaloDoMes(formatarMesReceita(mesCursor));

      const [receitas, despesas] = await Promise.all([
        this.receitaRepository.listByUsuario({
          usuarioId,
          perfilFinanceiroId,
          dataInicio: intervalo.inicio,
          dataFim: intervalo.fim,
        }),
        this.despesaRepository.listByUsuario({
          usuarioId,
          perfilFinanceiroId,
          dataInicio: intervalo.inicio,
          dataFim: intervalo.fim,
        }),
      ]);

      saldo += somarReceitas(receitas) - somarDespesas(despesas);
      mesCursor.setMonth(mesCursor.getMonth() + 1);
    }

    return saldo;
  }

  private async calcularResumoDoMes(
    usuarioId: string,
    perfilFinanceiroId: string | null | undefined,
    mes: Date,
    saldoInicial: number,
  ) {
    const [receitas, despesas] = await Promise.all([
      this.buscarReceitasDoMes(usuarioId, perfilFinanceiroId, mes),
      this.buscarDespesasDoMes(usuarioId, perfilFinanceiroId, mes),
    ]);

    const totalReceitas = somarReceitas(receitas);
    const totalDespesas = somarDespesas(despesas);
    const totalDespesasPagas = somarDespesas(
      despesas.filter((despesa) => despesa.paga),
    );
    const totalDespesasPendentes = somarDespesas(
      despesas.filter((despesa) => !despesa.paga),
    );

    return {
      saldoInicial,
      totalReceitas,
      totalDespesas,
      totalDespesasPagas,
      totalDespesasPendentes,
      saldoFinal: saldoInicial + totalReceitas - totalDespesas,
      contasVencidas: despesas.filter(despesaEstaVencida).length,
    };
  }

  private async calcularEvolucao(
    usuarioId: string,
    perfilFinanceiroId: string | null | undefined,
    primeiroMes: Date,
    quantidadeMeses: number,
  ) {
    const evolucao: MovimentoMensal[] = [];
    let saldo = await this.calcularSaldoAteMes(
      usuarioId,
      perfilFinanceiroId,
      primeiroMes,
    );

    for (let index = 0; index < quantidadeMeses; index++) {
      const mes = somarMeses(primeiroMes, index);
      const [receitas, despesas] = await Promise.all([
        this.buscarReceitasDoMes(usuarioId, perfilFinanceiroId, mes),
        this.buscarDespesasDoMes(usuarioId, perfilFinanceiroId, mes),
      ]);

      const totalReceitas = somarReceitas(receitas);
      const totalDespesas = somarDespesas(despesas);
      const saldoFinal = saldo + totalReceitas - totalDespesas;

      evolucao.push({
        mes: formatarMesReceita(mes),
        receitas: totalReceitas,
        despesas: totalDespesas,
        saldoInicial: saldo,
        saldoFinal,
      });

      saldo = saldoFinal;
    }

    return evolucao;
  }

  private async buscarReceitasDoMes(
    usuarioId: string,
    perfilFinanceiroId: string | null | undefined,
    mes: Date,
  ) {
    const chave = `${usuarioId}:${perfilFinanceiroId ?? "sem-perfil"}:${formatarMesReceita(mes)}`;
    const receitaEmCache = this.receitasPorMes.get(chave);

    if (receitaEmCache) {
      return receitaEmCache;
    }

    const intervalo = criarIntervaloDoMes(formatarMesReceita(mes));

    const promessa = this.receitaRepository.listByUsuario({
      usuarioId,
      perfilFinanceiroId,
      dataInicio: intervalo.inicio,
      dataFim: intervalo.fim,
    });

    this.receitasPorMes.set(chave, promessa);

    return promessa;
  }

  private async buscarDespesasDoMes(
    usuarioId: string,
    perfilFinanceiroId: string | null | undefined,
    mes: Date,
  ) {
    const chave = `${usuarioId}:${perfilFinanceiroId ?? "sem-perfil"}:${formatarMesReceita(mes)}`;
    const despesaEmCache = this.despesasPorMes.get(chave);

    if (despesaEmCache) {
      return despesaEmCache;
    }

    const intervalo = criarIntervaloDoMes(formatarMesReceita(mes));

    const promessa = this.despesaRepository.listByUsuario({
      usuarioId,
      perfilFinanceiroId,
      dataInicio: intervalo.inicio,
      dataFim: intervalo.fim,
    });

    this.despesasPorMes.set(chave, promessa);

    return promessa;
  }

  private async buscarPrimeiroMesComMovimento(
    usuarioId: string,
    perfilFinanceiroId: string | null | undefined,
    mesLimite: Date,
  ) {
    const [primeiraReceita, primeiraDespesa] = await Promise.all([
      prisma.receita.aggregate({
        where: {
          usuarioId,
          perfilFinanceiroId: perfilFinanceiroId ?? null,
          data: { lt: mesLimite },
        },
        _min: { data: true },
      }),
      prisma.despesa.aggregate({
        where: {
          usuarioId,
          perfilFinanceiroId: perfilFinanceiroId ?? null,
          mesReferencia: { lt: mesLimite },
        },
        _min: { mesReferencia: true },
      }),
    ]);

    const datas = [
      primeiraReceita._min.data,
      primeiraDespesa._min.mesReferencia,
    ].filter((data): data is Date => Boolean(data));

    if (datas.length === 0) {
      return new Date(mesLimite);
    }

    const primeiraData = new Date(Math.min(...datas.map((data) => data.getTime())));

    return new Date(primeiraData.getFullYear(), primeiraData.getMonth(), 1);
  }

  private async buscarTodasDespesasDoPeriodo(
    usuarioId: string,
    perfilFinanceiroId: string | null | undefined,
    primeiroMes: Date,
    quantidadeMeses: number,
  ) {
    const promessas = Array.from({ length: quantidadeMeses }, (_, index) => {
      const mes = somarMeses(primeiroMes, index);
      return this.buscarDespesasDoMes(usuarioId, perfilFinanceiroId, mes);
    });

    const todasDespesas = await Promise.all(promessas);
    return todasDespesas.flat();
  }

  private montarPizzaCategorias(despesas: Despesa[]) {
    const categorias = new Map<string, number>();

    despesas.forEach((despesa) => {
      const categoria = despesa.categoriaNome ?? "Sem categoria";
      categorias.set(categoria, (categorias.get(categoria) ?? 0) + Number(despesa.valor));
    });

    return Array.from(categorias.entries()).map(([categoria, total]) => ({
      categoria,
      total,
    }));
  }

  private montarMaioresGastos(despesas: Despesa[]) {
    return despesas
      .map((despesa) => ({
        id: despesa.id,
        nome: despesa.descricao,
        categoria: despesa.categoriaNome ?? "Sem categoria",
        valor: Number(despesa.valor),
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);
  }
}
