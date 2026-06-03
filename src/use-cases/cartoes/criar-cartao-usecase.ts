import { CartaoRepositoryInterface } from "../../repositories/interface/cartoes/cartao-repo-interface";
import { UsuarioRepositoryInterface } from "../../repositories/interface/usuarios/usuario-repo-interface";
import { CartaoJaExisteError, formatarCartao } from "./cartao-dados";

interface CriarCartaoUseCaseRequest {
  usuarioId: string;
  perfilFinanceiroId?: string | null;
  nome: string;
}

import { UsuarioNaoEncontradoError } from "../../errors/app-errors";
export { UsuarioNaoEncontradoError };

export class CriarCartaoUseCase {
  constructor(
    private cartaoRepository: CartaoRepositoryInterface,
    private usuarioRepository: UsuarioRepositoryInterface,
  ) {}

  async execute({ usuarioId, perfilFinanceiroId, nome }: CriarCartaoUseCaseRequest) {
    // Confere se o usuario existe antes de criar o cartao.
    const usuario = await this.usuarioRepository.findById(usuarioId);

    if (!usuario) {
      throw new UsuarioNaoEncontradoError();
    }

    const nomeFormatado = nome.trim();
    const cartaoExistente = await this.cartaoRepository.findByNomeAndUsuario(
      nomeFormatado,
      usuarioId,
      perfilFinanceiroId,
    );

    if (cartaoExistente) {
      throw new CartaoJaExisteError();
    }

    const cartao = await this.cartaoRepository.create({
      usuarioId,
      perfilFinanceiroId,
      nome: nomeFormatado,
    });

    return formatarCartao(cartao);
  }
}
