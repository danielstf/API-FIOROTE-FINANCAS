import { UsuarioRepository } from "../../repositories/repository/usuarios/usuario-repository";
import { RedefinirSenhaUseCase } from "../../use-cases/usuarios/redefinir-senha-usecase";

export function makeRedefinirSenhaFactory() {
  const usuarioRepository = new UsuarioRepository();

  const redefinirSenhaUseCase = new RedefinirSenhaUseCase(usuarioRepository);

  return redefinirSenhaUseCase;
}
