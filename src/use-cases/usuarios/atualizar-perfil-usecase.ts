import { Usuario } from "@prisma/client";
import { UsuarioRepositoryInterface } from "../../repositories/interface/usuarios/usuario-repo-interface";

interface AtualizarPerfilUseCaseRequest {
  usuarioId: string;
  nome: string;
}

interface AtualizarPerfilUseCaseResponse {
  usuario: Usuario;
}

import { UsuarioNaoEncontradoError } from "../../errors/app-errors";
export { UsuarioNaoEncontradoError };

export class AtualizarPerfilUseCase {
  constructor(private usuarioRepository: UsuarioRepositoryInterface) {}

  async execute({
    usuarioId,
    nome,
  }: AtualizarPerfilUseCaseRequest): Promise<AtualizarPerfilUseCaseResponse> {
    const usuario = await this.usuarioRepository.findById(usuarioId);

    if (!usuario) {
      throw new UsuarioNaoEncontradoError();
    }

    const usuarioAtualizado = await this.usuarioRepository.update(usuario.id, {
      nome: formatarNome(nome),
    });

    return {
      usuario: usuarioAtualizado,
    };
  }
}

function formatarNome(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/\p{L}+/gu, (word) => {
      return word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1);
    });
}
