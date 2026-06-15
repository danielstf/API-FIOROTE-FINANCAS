import { CartaoRepositoryInterface } from "../../repositories/interface/cartoes/cartao-repo-interface";
import { CartaoNaoEncontradoError } from "./cartao-dados";

interface ExcluirCartaoUseCaseRequest {
  usuarioId: string;
  cartaoId: string;
  perfilFinanceiroId?: string | null;
}

export class ExcluirCartaoUseCase {
  constructor(private cartaoRepository: CartaoRepositoryInterface) {}

  async execute({ usuarioId, cartaoId, perfilFinanceiroId }: ExcluirCartaoUseCaseRequest) {
    // Garante que o cartao pertence ao usuario (e ao perfil) antes de excluir.
    const cartao = await this.cartaoRepository.findByIdAndUsuario(
      cartaoId,
      usuarioId,
      perfilFinanceiroId,
    );

    if (!cartao) {
      throw new CartaoNaoEncontradoError();
    }

    await this.cartaoRepository.delete(cartaoId);
  }
}
