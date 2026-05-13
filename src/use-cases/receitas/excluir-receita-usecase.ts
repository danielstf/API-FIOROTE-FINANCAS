import { ReceitaRepositoryInterface } from "../../repositories/interface/receitas/receita-repo-interface";
import { ReceitaNaoEncontradaError } from "./obter-receita-usecase";

interface ExcluirReceitaUseCaseRequest {
  usuarioId: string;
  receitaId: string;
}

export class ExcluirReceitaUseCase {
  constructor(private receitaRepository: ReceitaRepositoryInterface) {}

  async execute({ usuarioId, receitaId }: ExcluirReceitaUseCaseRequest) {
    // Garante que a receita existe e pertence ao usuario antes de excluir.
    const receita = await this.receitaRepository.findByIdAndUsuario(
      receitaId,
      usuarioId,
    );

    if (!receita) {
      throw new ReceitaNaoEncontradaError();
    }

    await this.receitaRepository.delete(receitaId);
  }
}
