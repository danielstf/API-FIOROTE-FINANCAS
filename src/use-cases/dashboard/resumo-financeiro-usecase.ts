import { Despesa, Receita } from "@prisma/client";
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
  constructor(
    private receitaRepository: ReceitaRepositoryInterface,
    private despesaRepository: DespesaRepositoryInterface,
  ) {}

  async execute({ usuarioId, mes, meses }: ResumoFinanceiroUseCaseRequest) {
    const mesAtual = criarDataDoMes(mes);
    const quantidadeMeses = Math.min(Math.max(meses, 1), 24);
    const primeiroMesGrafico = somarMeses(mesAtual, -(quantidadeMeses - 1));

    const saldoInicial = await this.calcularSaldoAteMes(usuarioId, mesAtual);
    const resumoMes = await this.calcularResumoDoMes(
      usuarioId,
      mesAtual,
      saldoInicial,
    );
    const evolucao = await this.calcularEvolucao(
      usuarioId,
      primeiroMesGrafico,
      quantidadeMeses,
    );

    const despesasDoMes = await this.buscarDespesasDoMes(usuarioId, mesAtual);

    return {
      mes,
      resumo: resumoMes,
      graficos: {
        pizzaDespesasPorCategoria: this.montarPizzaCategorias(despesasDoMes),
        barrasMaioresGastos: this.montarMaioresGastos(despesasDoMes),
        linhaEvolucaoFinanceira: evolucao,
        linhaEvolucaoGastos: evolucao.map((item) => ({
          mes: item.mes,
          totalDespesas: item.despesas,
        })),
      },
    };
  }

  private async calcularSaldoAteMes(usuarioId: string, mesLimite: Date) {
    let saldo = 0;
    const mesCursor = new Date(2000, 0, 1);

    while (mesCursor < mesLimite) {
      const intervalo = criarIntervaloDoMes(formatarMesReceita(mesCursor));

      const [receitas, despesas] = await Promise.all([
        this.receitaRepository.listByUsuario({
          usuarioId,
          dataInicio: intervalo.inicio,
          dataFim: intervalo.fim,
        }),
        this.despesaRepository.listByUsuario({
          usuarioId,
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
    mes: Date,
    saldoInicial: number,
  ) {
    const [receitas, despesas] = await Promise.all([
      this.buscarReceitasDoMes(usuarioId, mes),
      this.buscarDespesasDoMes(usuarioId, mes),
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
    primeiroMes: Date,
    quantidadeMeses: number,
  ) {
    const evolucao: MovimentoMensal[] = [];
    let saldo = await this.calcularSaldoAteMes(usuarioId, primeiroMes);

    for (let index = 0; index < quantidadeMeses; index++) {
      const mes = somarMeses(primeiroMes, index);
      const [receitas, despesas] = await Promise.all([
        this.buscarReceitasDoMes(usuarioId, mes),
        this.buscarDespesasDoMes(usuarioId, mes),
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

  private async buscarReceitasDoMes(usuarioId: string, mes: Date) {
    const intervalo = criarIntervaloDoMes(formatarMesReceita(mes));

    return this.receitaRepository.listByUsuario({
      usuarioId,
      dataInicio: intervalo.inicio,
      dataFim: intervalo.fim,
    });
  }

  private async buscarDespesasDoMes(usuarioId: string, mes: Date) {
    const intervalo = criarIntervaloDoMes(formatarMesReceita(mes));

    return this.despesaRepository.listByUsuario({
      usuarioId,
      dataInicio: intervalo.inicio,
      dataFim: intervalo.fim,
    });
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
