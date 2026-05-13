import { ReceitaRepository } from "../../repositories/repository/receitas/receita-repository";
import { ObterReceitaUseCase } from "../../use-cases/receitas/obter-receita-usecase";

export function makeObterReceitaFactory() {
  const receitaRepository = new ReceitaRepository();

  const obterReceitaUseCase = new ObterReceitaUseCase(receitaRepository);

  return obterReceitaUseCase;
}
