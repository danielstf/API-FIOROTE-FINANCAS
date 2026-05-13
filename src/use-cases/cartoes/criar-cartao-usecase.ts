import { CartaoRepositoryInterface } from "../../repositories/interface/cartoes/cartao-repo-interface";
import { UsuarioRepositoryInterface } from "../../repositories/interface/usuarios/usuario-repo-interface";
import { CartaoJaExisteError, formatarCartao } from "./cartao-dados";

interface CriarCartaoUseCaseRequest {
  usuarioId: string;
  nome: string;
}

export class UsuarioNaoEncontradoError extends Error {
  constructor() {
    super("Usuario nao encontrado");
  }
}

export class CriarCartaoUseCase {
  constructor(
    private cartaoRepository: CartaoRepositoryInterface,
    private usuarioRepository: UsuarioRepositoryInterface,
  ) {}

  async execute({ usuarioId, nome }: CriarCartaoUseCaseRequest) {
    // Confere se o usuario existe antes de criar o cartao.
    const usuario = await this.usuarioRepository.findById(usuarioId);

    if (!usuario) {
      throw new UsuarioNaoEncontradoError();
    }

    const nomeFormatado = nome.trim();
    const cartaoExistente = await this.cartaoRepository.findByNomeAndUsuario(
      nomeFormatado,
      usuarioId,
    );

    if (cartaoExistente) {
      throw new CartaoJaExisteError();
    }

    const cartao = await this.cartaoRepository.create({
      usuarioId,
      nome: nomeFormatado,
    });

    return formatarCartao(cartao);
  }
}
