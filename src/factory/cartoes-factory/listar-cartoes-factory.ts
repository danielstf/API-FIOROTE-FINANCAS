import { CartaoRepository } from "../../repositories/repository/cartoes/cartao-repository";
import { ListarCartoesUseCase } from "../../use-cases/cartoes/listar-cartoes-usecase";

export function makeListarCartoesFactory() {
  const cartaoRepository = new CartaoRepository();

  const listarCartoesUseCase = new ListarCartoesUseCase(cartaoRepository);

  return listarCartoesUseCase;
}
