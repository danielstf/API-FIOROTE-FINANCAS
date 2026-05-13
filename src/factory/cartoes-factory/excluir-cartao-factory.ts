import { CartaoRepository } from "../../repositories/repository/cartoes/cartao-repository";
import { ExcluirCartaoUseCase } from "../../use-cases/cartoes/excluir-cartao-usecase";

export function makeExcluirCartaoFactory() {
  const cartaoRepository = new CartaoRepository();

  const excluirCartaoUseCase = new ExcluirCartaoUseCase(cartaoRepository);

  return excluirCartaoUseCase;
}
