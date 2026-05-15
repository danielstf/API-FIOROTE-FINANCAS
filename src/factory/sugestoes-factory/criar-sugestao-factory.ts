import { SugestaoRepository } from "../../repositories/repository/sugestoes/sugestao-repository";
import { UsuarioRepository } from "../../repositories/repository/usuarios/usuario-repository";
import { CriarSugestaoUseCase } from "../../use-cases/sugestoes/criar-sugestao-usecase";

export function makeCriarSugestaoFactory() {
  const sugestaoRepository = new SugestaoRepository();
  const usuarioRepository = new UsuarioRepository();

  return new CriarSugestaoUseCase(sugestaoRepository, usuarioRepository);
}
