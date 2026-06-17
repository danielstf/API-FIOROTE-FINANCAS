import { DespesaRepositoryInterface } from "../../repositories/interface/despesas/despesa-repo-interface";
import { DespesaNaoEncontradaError } from "./obter-despesa-usecase";
import { criarDataDoMes } from "../receitas/receita-mes";

interface ExcluirDespesaUseCaseRequest {
  usuarioId: string;
  despesaId: string;
  excluirParcelas?: boolean;
  escopo?: "mes" | "todas";
  mes?: string;
}

export class ExcluirDespesaUseCase {
  constructor(private despesaRepository: DespesaRepositoryInterface) {}

  async execute({
    usuarioId,
    despesaId,
    excluirParcelas = false,
    escopo,
    mes,
  }: ExcluirDespesaUseCaseRequest) {
    // Garante que a despesa pertence ao usuario antes de excluir.
    const despesa = await this.despesaRepository.findByIdAndUsuario(
      despesaId,
      usuarioId,
    );

    if (!despesa) {
      throw new DespesaNaoEncontradaError();
    }

    const excluirTodas = escopo === "todas" || excluirParcelas;

    if (despesa.fixa && !excluirTodas) {
      await this.despesaRepository.createExcecaoRecorrencia(
        despesa.id,
        usuarioId,
        mes ? criarDataDoMes(mes) : despesa.mesReferencia,
      );
      return;
    }

    if (despesa.fixa && excluirTodas) {
      const mesAlvo = mes ? criarDataDoMes(mes) : new Date(despesa.mesReferencia);
      mesAlvo.setDate(1);
      mesAlvo.setHours(0, 0, 0, 0);

      const mesOrigem = new Date(despesa.mesReferencia);
      mesOrigem.setDate(1);
      mesOrigem.setHours(0, 0, 0, 0);

      // Sem histórico anterior ao mês alvo → delete completo com limpeza de exceções.
      if (mesAlvo <= mesOrigem) {
        await this.despesaRepository.deleteComExcecoes(despesa.id);
        return;
      }

      // Há meses anteriores com histórico → encerra a recorrência a partir do mês alvo,
      // preservando os registros passados para fins de auditoria.
      const recorrenciaFim = new Date(mesAlvo);
      recorrenciaFim.setDate(recorrenciaFim.getDate() - 1);
      await this.despesaRepository.update(despesa.id, { recorrenciaFim, recorrenciaEncerrada: true });
      return;
    }

    if (excluirTodas && despesa.parcelamentoId) {
      await this.despesaRepository.deleteByParcelamento(
        despesa.parcelamentoId,
        usuarioId,
      );
      return;
    }

    await this.despesaRepository.delete(despesaId);
  }
}
