import { ReceitaRepository } from "../../repositories/repository/receitas/receita-repository";
import { EditarReceitaUseCase } from "../../use-cases/receitas/editar-receita-usecase";

export function makeEditarReceitaFactory() {
  const receitaRepository = new ReceitaRepository();

  const editarReceitaUseCase = new EditarReceitaUseCase(receitaRepository);

  return editarReceitaUseCase;
}
