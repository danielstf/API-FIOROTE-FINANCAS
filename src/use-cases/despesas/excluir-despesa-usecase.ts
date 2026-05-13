import { DespesaRepositoryInterface } from "../../repositories/interface/despesas/despesa-repo-interface";
import { DespesaNaoEncontradaError } from "./obter-despesa-usecase";

interface ExcluirDespesaUseCaseRequest {
  usuarioId: string;
  despesaId: string;
}

export class ExcluirDespesaUseCase {
  constructor(private despesaRepository: DespesaRepositoryInterface) {}

  async execute({ usuarioId, despesaId }: ExcluirDespesaUseCaseRequest) {
    // Garante que a despesa pertence ao usuario antes de excluir.
    const despesa = await this.despesaRepository.findByIdAndUsuario(
      despesaId,
      usuarioId,
    );

    if (!despesa) {
      throw new DespesaNaoEncontradaError();
    }

    await this.despesaRepository.delete(despesaId);
  }
}
