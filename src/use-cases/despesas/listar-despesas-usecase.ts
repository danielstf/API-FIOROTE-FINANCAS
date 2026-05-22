import { FormaPagamentoDespesa } from "@prisma/client";
import { DespesaRepositoryInterface } from "../../repositories/interface/despesas/despesa-repo-interface";
import { formatarDespesa } from "./despesa-dados";
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
    // O filtro rapido de cartao sobrescreve a forma quando ativado.
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

    const itens = despesas.map(formatarDespesa);

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
