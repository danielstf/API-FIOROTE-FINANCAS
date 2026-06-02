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
      // Um dia antes do mês alvo garante que a renovação automática não re-estenda
      // a data (renovarRecorrenciasFixas só toca registros com recorrenciaFim >= mesAtual)
      // e que a despesa não apareça a partir do mês selecionado na query de listagem.
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
