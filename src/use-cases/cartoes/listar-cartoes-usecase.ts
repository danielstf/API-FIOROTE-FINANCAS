import { CartaoRepositoryInterface } from "../../repositories/interface/cartoes/cartao-repo-interface";
import { formatarCartao } from "./cartao-dados";

interface ListarCartoesUseCaseRequest {
  usuarioId: string;
  perfilFinanceiroId?: string | null;
}

export class ListarCartoesUseCase {
  constructor(private cartaoRepository: CartaoRepositoryInterface) {}

  async execute({ usuarioId, perfilFinanceiroId }: ListarCartoesUseCaseRequest) {
    const cartoes = await this.cartaoRepository.listByUsuario(
      usuarioId,
      perfilFinanceiroId,
    );

    return {
      cartoes: cartoes.map(formatarCartao),
    };
  }
}
