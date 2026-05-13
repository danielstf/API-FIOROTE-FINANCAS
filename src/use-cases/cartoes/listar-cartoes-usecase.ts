import { CartaoRepositoryInterface } from "../../repositories/interface/cartoes/cartao-repo-interface";
import { formatarCartao } from "./cartao-dados";

interface ListarCartoesUseCaseRequest {
  usuarioId: string;
}

export class ListarCartoesUseCase {
  constructor(private cartaoRepository: CartaoRepositoryInterface) {}

  async execute({ usuarioId }: ListarCartoesUseCaseRequest) {
    const cartoes = await this.cartaoRepository.listByUsuario(usuarioId);

    return {
      cartoes: cartoes.map(formatarCartao),
    };
  }
}
