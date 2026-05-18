import { PerfilRepository } from "../../repositories/repository/perfis/perfil-repository";
import { PerfilNaoEncontradoError } from "./perfil-erros";
import { formatarPerfil } from "./perfil-dados";

interface Request {
  usuarioId: string;
  perfilId: string;
  nome?: string;
  avatar?: string;
  tema?: string;
}

export class EditarPerfilUseCase {
  constructor(private perfilRepository: PerfilRepository) {}

  async execute({ usuarioId, perfilId, nome, avatar, tema }: Request) {
    const atual = await this.perfilRepository.findByIdAndUsuario(perfilId, usuarioId);
    if (!atual) throw new PerfilNaoEncontradoError();

    const perfil = await this.perfilRepository.update(perfilId, {
      nome: nome?.trim(),
      avatar,
      tema,
    });

    return formatarPerfil(perfil);
  }
}