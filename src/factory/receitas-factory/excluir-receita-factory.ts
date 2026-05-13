import { ReceitaRepository } from "../../repositories/repository/receitas/receita-repository";
import { ExcluirReceitaUseCase } from "../../use-cases/receitas/excluir-receita-usecase";

export function makeExcluirReceitaFactory() {
  const receitaRepository = new ReceitaRepository();

  const excluirReceitaUseCase = new ExcluirReceitaUseCase(receitaRepository);

  return excluirReceitaUseCase;
}
