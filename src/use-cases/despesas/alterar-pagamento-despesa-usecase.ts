import { DespesaRepositoryInterface } from "../../repositories/interface/despesas/despesa-repo-interface";
import { criarDataOpcional, formatarDespesa } from "./despesa-dados";
import { DespesaNaoEncontradaError } from "./obter-despesa-usecase";

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
  }: AlterarPagamentoDespesaUseCaseRequest) {
    const despesaExistente = await this.despesaRepository.findByIdAndUsuario(
      despesaId,
      usuarioId,
    );

    if (!despesaExistente) {
      throw new DespesaNaoEncontradaError();
    }

    const despesa = await this.despesaRepository.update(despesaId, {
      paga,
      dataPagamento: paga ? criarDataOpcional(new Date().toISOString().slice(0, 10)) : null,
    });

    return formatarDespesa(despesa);
  }
}
