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

  async execute({ usuarioId, receitaId, mes }: ExcluirReceitaUseCaseRequest) {
    const receita = await this.receitaRepository.findByIdAndUsuario(
      receitaId,
      usuarioId,
    );

    if (!receita) {
      throw new ReceitaNaoEncontradaError();
    }

    // Receita fixa: qualquer escopo encerra a recorrência permanentemente.
    // Não cria mais exceção por mês — a receita nunca reaparece após excluída.
    if (receita.fixa) {
      await this.receitaRepository.update(receita.id, {
        recorrenciaFim: mes ? criarDataDoMes(mes) : receita.data,
        recorrenciaEncerrada: true,
      });
      return;
    }

    await this.receitaRepository.delete(receitaId);
  }
}
