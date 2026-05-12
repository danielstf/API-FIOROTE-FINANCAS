import { UsuarioRepository } from "../../repositories/repository/usuarios/usuario-repository";
import { SolicitarRedefinicaoSenhaUseCase } from "../../use-cases/usuarios/solicitar-redefinicao-senha-usecase";

export function makeSolicitarRedefinicaoSenhaFactory() {
  const usuarioRepository = new UsuarioRepository();

  const solicitarRedefinicaoSenhaUseCase =
    new SolicitarRedefinicaoSenhaUseCase(usuarioRepository);

  return solicitarRedefinicaoSenhaUseCase;
}
