import { DespesaRepositoryInterface } from "../../repositories/interface/despesas/despesa-repo-interface";
import { formatarDespesa } from "./despesa-dados";

interface ObterDespesaUseCaseRequest {
  usuarioId: string;
  despesaId: string;
}

export class DespesaNaoEncontradaError extends Error {
  constructor() {
    super("Despesa nao encontrada");
  }
}

export class ObterDespesaUseCase {
  constructor(private despesaRepository: DespesaRepositoryInterface) {}

  async execute({ usuarioId, despesaId }: ObterDespesaUseCaseRequest) {
    // Busca somente despesas pertencentes ao usuario logado.
    const despesa = await this.despesaRepository.findByIdAndUsuario(
      despesaId,
      usuarioId,
    );

    if (!despesa) {
      throw new DespesaNaoEncontradaError();
    }

    return formatarDespesa(despesa);
  }
}
