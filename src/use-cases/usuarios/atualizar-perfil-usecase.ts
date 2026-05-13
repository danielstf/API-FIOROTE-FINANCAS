import { Usuario } from "@prisma/client";
import { UsuarioRepositoryInterface } from "../../repositories/interface/usuarios/usuario-repo-interface";

interface AtualizarPerfilUseCaseRequest {
  usuarioId: string;
  nome: string;
}

interface AtualizarPerfilUseCaseResponse {
  usuario: Usuario;
}

export class UsuarioNaoEncontradoError extends Error {
  constructor() {
    super("Usuario nao encontrado");
  }
}

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
      nome,
    });

    return {
      usuario: usuarioAtualizado,
    };
  }
}
