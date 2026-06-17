import { FormaPagamentoDespesa } from "@prisma/client";
import { DespesaRepositoryInterface } from "../../repositories/interface/despesas/despesa-repo-interface";
import { despesaEstaVencida, formatarDespesa } from "./despesa-dados";
import { criarIntervaloDoMes, formatarMesReceita } from "../receitas/receita-mes";

interface ListarDespesasUseCaseRequest {
  usuarioId: string;
  perfilFinanceiroId?: string | null;
  mes?: string;
  formaPagamento?: FormaPagamentoDespesa;
  cartaoCreditoId?: string;
  somenteCartao?: boolean;
  somenteVencidas?: boolean;
  paga?: boolean;
}

export class ListarDespesasUseCase {
  constructor(private despesaRepository: DespesaRepositoryInterface) {}

  async execute({
    usuarioId,
    perfilFinanceiroId,
    mes,
    formaPagamento,
    cartaoCreditoId,
    somenteCartao,
    somenteVencidas,
    paga,
  }: ListarDespesasUseCaseRequest) {
    const filtroForma = somenteCartao
      ? FormaPagamentoDespesa.CARTAO_CREDITO
      : formaPagamento;
    const mesConsulta = mes ?? formatarMesReceita(new Date());
    const filtroMes = criarIntervaloDoMes(mesConsulta);

    const despesas = await this.despesaRepository.listByUsuario({
      usuarioId,
      perfilFinanceiroId,
      formaPagamento: filtroForma,
      cartaoCreditoId,
      dataInicio: filtroMes.inicio,
      dataFim: filtroMes.fim,
      somenteVencidas,
      paga,
    });

    const [anoConsulta, mesNumConsulta] = mesConsulta.split("-").map(Number);

    const itens = despesas.map((despesa) => {
      const formatted = formatarDespesa(despesa);

      // Para despesas fixas com vencimento, ajusta o dia para o mes consultado.
      // O dia do vencimento (ex: dia 15) é preservado; só o mês/ano muda.
      if (formatted.fixa && formatted.dataVencimento) {
        const diaOriginal = new Date(formatted.dataVencimento).getDate();
        const ultimoDiaDoMes = new Date(anoConsulta, mesNumConsulta, 0).getDate();
        const diaAjustado = Math.min(diaOriginal, ultimoDiaDoMes);
        const novoVencimento = new Date(anoConsulta, mesNumConsulta - 1, diaAjustado);
        formatted.dataVencimento = novoVencimento;
        formatted.vencida = despesaEstaVencida({ paga: formatted.paga, dataVencimento: novoVencimento });
        formatted.alerta = formatted.vencida ? "Conta vencida" : null;
      }

      return formatted;
    });

    return {
      despesas: itens,
      total: itens.reduce((total, despesa) => total + despesa.valor, 0),
      totalPendente: itens
        .filter((despesa) => !despesa.paga)
        .reduce((total, despesa) => total + despesa.valor, 0),
      totalPago: itens
        .filter((despesa) => despesa.paga)
        .reduce((total, despesa) => total + despesa.valor, 0),
      contasVencidas: itens.filter((despesa) => despesa.vencida).length,
    };
  }
}
