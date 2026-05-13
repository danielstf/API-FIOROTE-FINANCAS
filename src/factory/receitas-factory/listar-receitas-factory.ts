import { ReceitaRepository } from "../../repositories/repository/receitas/receita-repository";
import { ListarReceitasUseCase } from "../../use-cases/receitas/listar-receitas-usecase";

export function makeListarReceitasFactory() {
  const receitaRepository = new ReceitaRepository();

  const listarReceitasUseCase = new ListarReceitasUseCase(receitaRepository);

  return listarReceitasUseCase;
}
