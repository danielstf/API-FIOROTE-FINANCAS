import { DespesaRepository } from "../../repositories/repository/despesas/despesa-repository";
import { ListarDespesasUseCase } from "../../use-cases/despesas/listar-despesas-usecase";

export function makeListarDespesasFactory() {
  const despesaRepository = new DespesaRepository();

  const listarDespesasUseCase = new ListarDespesasUseCase(despesaRepository);

  return listarDespesasUseCase;
}
