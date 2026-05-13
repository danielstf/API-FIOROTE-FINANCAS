import { CartaoRepositoryInterface } from "../../repositories/interface/cartoes/cartao-repo-interface";
import { CartaoNaoEncontradoError } from "./cartao-dados";

interface ExcluirCartaoUseCaseRequest {
  usuarioId: string;
  cartaoId: string;
}

export class ExcluirCartaoUseCase {
  constructor(private cartaoRepository: CartaoRepositoryInterface) {}

  async execute({ usuarioId, cartaoId }: ExcluirCartaoUseCaseRequest) {
    // Garante que o cartao pertence ao usuario antes de excluir.
    const cartao = await this.cartaoRepository.findByIdAndUsuario(
      cartaoId,
      usuarioId,
    );

    if (!cartao) {
      throw new CartaoNaoEncontradoError();
    }

    await this.cartaoRepository.delete(cartaoId);
  }
}
