import { ReceitaRepositoryInterface } from "../../repositories/interface/receitas/receita-repo-interface";
import { ReceitaNaoEncontradaError } from "./obter-receita-usecase";
import { criarDataDoMes } from "./receita-mes";

interface ExcluirReceitaUseCaseRequest {
  usuarioId: string;
  receitaId: string;
  escopo?: "mes" | "todas";
  mes?: string;
}

export class ExcluirReceitaUseCase {
  constructor(private receitaRepository: ReceitaRepositoryInterface) {}

  async execute({ usuarioId, receitaId, escopo, mes }: ExcluirReceitaUseCaseRequest) {
    // Garante que a receita existe e pertence ao usuario antes de excluir.
    const receita = await this.receitaRepository.findByIdAndUsuario(
      receitaId,
      usuarioId,
    );

    if (!receita) {
      throw new ReceitaNaoEncontradaError();
    }

    if (receita.fixa && escopo !== "todas") {
      await this.receitaRepository.createExcecaoRecorrencia(
        receita.id,
        usuarioId,
        mes ? criarDataDoMes(mes) : receita.data,
      );
      return;
    }

    if (receita.fixa && escopo === "todas") {
      await this.receitaRepository.update(receita.id, {
        recorrenciaFim: mes ? criarDataDoMes(mes) : receita.data,
        recorrenciaEncerrada: true,
      });
      return;
    }

    await this.receitaRepository.delete(receitaId);
  }
}
