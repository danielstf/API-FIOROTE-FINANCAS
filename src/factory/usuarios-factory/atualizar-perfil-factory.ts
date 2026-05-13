import { UsuarioRepository } from "../../repositories/repository/usuarios/usuario-repository";
import { AtualizarPerfilUseCase } from "../../use-cases/usuarios/atualizar-perfil-usecase";

export function makeAtualizarPerfilFactory() {
  const usuarioRepository = new UsuarioRepository();

  return new AtualizarPerfilUseCase(usuarioRepository);
}
