import { CartaoRepository } from "../../repositories/repository/cartoes/cartao-repository";
import { EditarCartaoUseCase } from "../../use-cases/cartoes/editar-cartao-usecase";

export function makeEditarCartaoFactory() {
  const cartaoRepository = new CartaoRepository();

  const editarCartaoUseCase = new EditarCartaoUseCase(cartaoRepository);

  return editarCartaoUseCase;
}
