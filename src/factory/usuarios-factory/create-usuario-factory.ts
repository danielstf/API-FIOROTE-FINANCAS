import { UsuarioRepository } from "../../repositories/repository/usuarios/usuario-repository";
import { CreateUsuarioUseCase } from "../../use-cases/usuarios/create-usuario-usecase";

export function makeCreateUsuarioFactory() {
  const usuarioRepository = new UsuarioRepository();

  const createUsuarioUseCase = new CreateUsuarioUseCase(usuarioRepository);

  return createUsuarioUseCase;
}
