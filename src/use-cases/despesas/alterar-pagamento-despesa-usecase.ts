import { DespesaRepositoryInterface } from "../../repositories/interface/despesas/despesa-repo-interface";
import { criarDataOpcional, formatarDespesa } from "./despesa-dados";
import { DespesaNaoEncontradaError } from "./obter-despesa-usecase";
import { criarDataDoMes, somarMeses } from "../receitas/receita-mes";

interface AlterarPagamentoDespesaUseCaseRequest {
  usuarioId: string;
  despesaId: string;
  paga: boolean;
  mes?: string;
}

export class AlterarPagamentoDespesaUseCase {
  constructor(private despesaRepository: DespesaRepositoryInterface) {}

  async execute({
    usuarioId,
    despesaId,
    paga,
    mes,
  }: AlterarPagamentoDespesaUseCaseRequest) {
    // O clique no icone de pagamento muda o status de paga/pendente.
    const despesaExistente = await this.despesaRepository.findByIdAndUsuario(
      despesaId,
      usuarioId,
    );

    if (!despesaExistente) {
      throw new DespesaNaoEncontradaError();
    }

    if (despesaExistente.fixa && mes) {
      const mesReferencia = criarDataDoMes(mes);
      const diferencaMeses =
        (mesReferencia.getFullYear() - despesaExistente.mesReferencia.getFullYear()) *
          12 +
        (mesReferencia.getMonth() - despesaExistente.mesReferencia.getMonth());
      const vencimento = despesaExistente.dataVencimento
        ? somarMeses(despesaExistente.dataVencimento, Math.max(diferencaMeses, 0))
        : null;

      await this.despesaRepository.createExcecaoRecorrencia(
        despesaExistente.id,
        usuarioId,
        mesReferencia,
      );

      const despesaDoMes = await this.despesaRepository.create({
        usuarioId: despesaExistente.usuarioId,
        perfilFinanceiroId: despesaExistente.perfilFinanceiroId,
        descricao: despesaExistente.descricao,
        valor: Number(despesaExistente.valor),
        categoriaNome: despesaExistente.categoriaNome,
        formaPagamento: despesaExistente.formaPagamento,
        cartaoCreditoId: despesaExistente.cartaoCreditoId,
        mesReferencia,
        dataVencimento: vencimento,
        fixa: false,
        numeroParcelas: null,
        parcelaAtual: null,
        parcelamentoId: null,
      });

      const despesa = await this.despesaRepository.update(despesaDoMes.id, {
        paga,
        dataPagamento: paga ? criarDataOpcional(new Date().toISOString().slice(0, 10)) : null,
      });

      return formatarDespesa(despesa);
    }

    const despesa = await this.despesaRepository.update(despesaId, {
      paga,
      dataPagamento: paga ? new Date() : null,
    });

    return formatarDespesa(despesa);
  }
}
