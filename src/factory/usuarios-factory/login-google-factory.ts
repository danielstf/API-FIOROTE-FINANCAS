import { UsuarioRepository } from "../../repositories/repository/usuarios/usuario-repository";
import { LoginGoogleUseCase } from "../../use-cases/usuarios/login-google-usecase";

export function makeLoginGoogleFactory() {
  const usuarioRepository = new UsuarioRepository();

  const loginGoogleUseCase = new LoginGoogleUseCase(usuarioRepository);

  return loginGoogleUseCase;
}
