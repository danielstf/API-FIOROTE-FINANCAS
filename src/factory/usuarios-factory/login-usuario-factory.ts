import { UsuarioRepository } from "../../repositories/repository/usuarios/usuario-repository";
import { LoginUsuarioUseCase } from "../../use-cases/usuarios/login-usuario-usecase";

export function makeLoginUsuarioFactory() {
  const usuarioRepository = new UsuarioRepository();

  const loginUsuarioUseCase = new LoginUsuarioUseCase(usuarioRepository);

  return loginUsuarioUseCase;
}
