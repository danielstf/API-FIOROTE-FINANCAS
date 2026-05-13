import { DespesaRepository } from "../../repositories/repository/despesas/despesa-repository";
import { ObterDespesaUseCase } from "../../use-cases/despesas/obter-despesa-usecase";

export function makeObterDespesaFactory() {
  const despesaRepository = new DespesaRepository();

  const obterDespesaUseCase = new ObterDespesaUseCase(despesaRepository);

  return obterDespesaUseCase;
}
