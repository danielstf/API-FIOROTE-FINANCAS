import { CartaoRepositoryInterface } from "../../repositories/interface/cartoes/cartao-repo-interface";
import {
  CartaoJaExisteError,
  CartaoNaoEncontradoError,
  formatarCartao,
} from "./cartao-dados";

interface EditarCartaoUseCaseRequest {
  usuarioId: string;
  cartaoId: string;
  nome: string;
}

export class EditarCartaoUseCase {
  constructor(private cartaoRepository: CartaoRepositoryInterface) {}

  async execute({ usuarioId, cartaoId, nome }: EditarCartaoUseCaseRequest) {
    // Garante que o cartao pertence ao usuario antes de alterar.
    const cartaoExistente = await this.cartaoRepository.findByIdAndUsuario(
      cartaoId,
      usuarioId,
    );

    if (!cartaoExistente) {
      throw new CartaoNaoEncontradoError();
    }

    const nomeFormatado = nome.trim();
    const cartaoComMesmoNome =
      await this.cartaoRepository.findByNomeAndUsuario(nomeFormatado, usuarioId);

    if (cartaoComMesmoNome && cartaoComMesmoNome.id !== cartaoId) {
      throw new CartaoJaExisteError();
    }

    const cartao = await this.cartaoRepository.update(cartaoId, {
      nome: nomeFormatado,
    });

    return formatarCartao(cartao);
  }
}
