import { DespesaRepository } from "../../repositories/repository/despesas/despesa-repository";
import { CartaoRepository } from "../../repositories/repository/cartoes/cartao-repository";
import { EditarDespesaUseCase } from "../../use-cases/despesas/editar-despesa-usecase";

export function makeEditarDespesaFactory() {
  const despesaRepository = new DespesaRepository();
  const cartaoRepository = new CartaoRepository();

  const editarDespesaUseCase = new EditarDespesaUseCase(
    despesaRepository,
    cartaoRepository,
  );

  return editarDespesaUseCase;
}
