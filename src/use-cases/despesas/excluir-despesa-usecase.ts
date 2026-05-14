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
