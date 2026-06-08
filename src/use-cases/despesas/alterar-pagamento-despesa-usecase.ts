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

export class MesObrigatorioParaDespesaFixaError extends Error {
  constructor() {
    super("O campo mes e obrigatorio para alterar o pagamento de uma despesa recorrente");
  }
}

export class AlterarPagamentoDespesaUseCase {
  constructor(private despesaRepository: DespesaRepositoryInterface) {}

  async execute({
    usuarioId,
    despesaId,
    paga,
    mes,
  }: AlterarPagamentoDespesaUseCaseRequest) {
    const despesaExistente = await this.despesaRepository.findByIdAndUsuario(
      despesaId,
      usuarioId,
    );

    if (!despesaExistente) {
      throw new DespesaNaoEncontradaError();
    }

    // Despesa recorrente: nunca alterar o registro original diretamente, pois
    // isso propagaria o status de pago para todos os meses. Sempre isolar via
    // excecao + copia avulsa restrita ao mes selecionado.
    if (despesaExistente.fixa) {
      if (!mes) {
        throw new MesObrigatorioParaDespesaFixaError();
      }

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
