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

    // Despesa fixa novo estilo: registros individuais agrupados por parcelamentoId.
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

    // Despesa fixa legada (estilo recorrência): encerra permanentemente.
    if (despesa.fixa && !despesa.parcelamentoId) {
      const mesAlvo = mes ? criarDataDoMes(mes) : new Date(despesa.mesReferencia);
      mesAlvo.setDate(1);
      mesAlvo.setHours(0, 0, 0, 0);

      const mesOrigem = new Date(despesa.mesReferencia);
      mesOrigem.setDate(1);
      mesOrigem.setHours(0, 0, 0, 0);

      if (mesAlvo <= mesOrigem) {
        await this.despesaRepository.deleteComExcecoes(despesa.id);
        return;
      }

      const recorrenciaFim = new Date(mesAlvo);
      recorrenciaFim.setDate(recorrenciaFim.getDate() - 1);
      await this.despesaRepository.update(despesa.id, {
        recorrenciaFim,
        recorrenciaEncerrada: true,
      });
      return;
    }

    // Parcelamento (não fixa).
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
