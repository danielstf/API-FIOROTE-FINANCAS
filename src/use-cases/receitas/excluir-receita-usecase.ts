import { ReceitaRepositoryInterface } from "../../repositories/interface/receitas/receita-repo-interface";
import { ReceitaNaoEncontradaError } from "./obter-receita-usecase";
import { criarDataDoMes, mesAtualOuFuturo, OperacaoEmMesPassadoError } from "./receita-mes";

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

    // Receita fixa: bloqueia operacoes em meses passados.
    if (receita.fixa) {
      const mesAlvo = mes ? criarDataDoMes(mes) : new Date(receita.data);
      if (!mesAtualOuFuturo(mesAlvo)) {
        throw new OperacaoEmMesPassadoError();
      }
    }

    // Receita parcelada: bloqueia se o registro pertence a um mes passado.
    if (!receita.fixa && receita.parcelamentoId) {
      if (!mesAtualOuFuturo(new Date(receita.data))) {
        throw new OperacaoEmMesPassadoError();
      }
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
