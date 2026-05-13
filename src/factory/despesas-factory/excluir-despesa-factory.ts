import { DespesaRepository } from "../../repositories/repository/despesas/despesa-repository";
import { ExcluirDespesaUseCase } from "../../use-cases/despesas/excluir-despesa-usecase";

export function makeExcluirDespesaFactory() {
  const despesaRepository = new DespesaRepository();

  const excluirDespesaUseCase = new ExcluirDespesaUseCase(despesaRepository);

  return excluirDespesaUseCase;
}
