import { UsuarioRepository } from "../../repositories/repository/usuarios/usuario-repository";
import { TrocarSenhaUseCase } from "../../use-cases/usuarios/trocar-senha-usecase";

export function makeTrocarSenhaFactory() {
  const usuarioRepository = new UsuarioRepository();

  const trocarSenhaUseCase = new TrocarSenhaUseCase(usuarioRepository);

  return trocarSenhaUseCase;
}
