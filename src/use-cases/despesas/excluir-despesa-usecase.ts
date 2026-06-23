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
    const despesa = await this.despesaRepository.findByIdAndUsuario(
      despesaId,
      usuarioId,
    );

    if (!despesa) {
      throw new DespesaNaoEncontradaError();
    }

    const excluirTodas = escopo === "todas" || excluirParcelas;

    // Despesa fixa: registros individuais agrupados por parcelamentoId.
    if (despesa.fixa && despesa.parcelamentoId) {
      if (excluirTodas) {
        const fromMes = mes ? criarDataDoMes(mes) : new Date(despesa.mesReferencia);
        await this.despesaRepository.deleteByParcelamentoFromMes(
          despesa.parcelamentoId,
          usuarioId,
          fromMes,
        );
      } else {
        await this.despesaRepository.delete(despesaId);
      }
      return;
    }

    // Parcelamento (não fixa): exclui todas as parcelas ou somente esta.
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
