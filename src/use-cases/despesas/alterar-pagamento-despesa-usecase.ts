import { DespesaRepositoryInterface } from "../../repositories/interface/despesas/despesa-repo-interface";
import { formatarDespesa } from "./despesa-dados";
import { DespesaNaoEncontradaError } from "./obter-despesa-usecase";

interface AlterarPagamentoDespesaUseCaseRequest {
  usuarioId: string;
  despesaId: string;
  paga: boolean;
}

export class AlterarPagamentoDespesaUseCase {
  constructor(private despesaRepository: DespesaRepositoryInterface) {}

  async execute({
    usuarioId,
    despesaId,
    paga,
  }: AlterarPagamentoDespesaUseCaseRequest) {
    // O clique no icone de pagamento muda o status de paga/pendente.
    const despesaExistente = await this.despesaRepository.findByIdAndUsuario(
      despesaId,
      usuarioId,
    );

    if (!despesaExistente) {
      throw new DespesaNaoEncontradaError();
    }

    const despesa = await this.despesaRepository.update(despesaId, {
      paga,
      dataPagamento: paga ? new Date() : null,
    });

    return formatarDespesa(despesa);
  }
}
