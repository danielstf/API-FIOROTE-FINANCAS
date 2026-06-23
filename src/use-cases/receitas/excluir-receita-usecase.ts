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
    const receita = await this.receitaRepository.findByIdAndUsuario(
      receitaId,
      usuarioId,
    );

    if (!receita) {
      throw new ReceitaNaoEncontradaError();
    }

    // Receita fixa novo estilo: registros individuais agrupados por parcelamentoId.
    if (receita.fixa && receita.parcelamentoId) {
      if (escopo === "todas") {
        const fromMes = mes ? criarDataDoMes(mes) : receita.data;
        await this.receitaRepository.deleteByParcelamentoFromMes(
          receita.parcelamentoId,
          usuarioId,
          fromMes,
        );
      } else {
        await this.receitaRepository.delete(receitaId);
      }
      return;
    }

    // Receita fixa legada (estilo recorrência): encerra permanentemente.
    if (receita.fixa && !receita.parcelamentoId) {
      await this.receitaRepository.update(receita.id, {
        recorrenciaFim: mes ? criarDataDoMes(mes) : receita.data,
        recorrenciaEncerrada: true,
      });
      return;
    }

    await this.receitaRepository.delete(receitaId);
  }
}
