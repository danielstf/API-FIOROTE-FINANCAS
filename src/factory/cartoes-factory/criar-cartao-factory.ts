import { CartaoRepository } from "../../repositories/repository/cartoes/cartao-repository";
import { UsuarioRepository } from "../../repositories/repository/usuarios/usuario-repository";
import { CriarCartaoUseCase } from "../../use-cases/cartoes/criar-cartao-usecase";

export function makeCriarCartaoFactory() {
  const cartaoRepository = new CartaoRepository();
  const usuarioRepository = new UsuarioRepository();

  const criarCartaoUseCase = new CriarCartaoUseCase(
    cartaoRepository,
    usuarioRepository,
  );

  return criarCartaoUseCase;
}
