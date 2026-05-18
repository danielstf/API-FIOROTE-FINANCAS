import { PerfilRepository } from "../repositories/repository/perfis/perfil-repository";
import { UsuarioRepository } from "../repositories/repository/usuarios/usuario-repository";
import { CriarPerfilUseCase } from "../use-cases/perfis/criar-perfil-usecase";
import { EditarPerfilUseCase } from "../use-cases/perfis/editar-perfil-usecase";
import { ExcluirPerfilUseCase } from "../use-cases/perfis/excluir-perfil-usecase";
import { ListarPerfisUseCase } from "../use-cases/perfis/listar-perfis-usecase";

export function makeListarPerfisFactory() {
  return new ListarPerfisUseCase(new PerfilRepository());
}

export function makeCriarPerfilFactory() {
  return new CriarPerfilUseCase(new PerfilRepository(), new UsuarioRepository());
}

export function makeEditarPerfilFactory() {
  return new EditarPerfilUseCase(new PerfilRepository());
}

export function makeExcluirPerfilFactory() {
  return new ExcluirPerfilUseCase(new PerfilRepository());
}