import { PerfilRepository } from "../../repositories/repository/perfis/perfil-repository";
import { formatarPerfil } from "./perfil-dados";

export class ListarPerfisUseCase {
  constructor(private perfilRepository: PerfilRepository) {}

  async execute(usuarioId: string) {
    const perfis = await this.perfilRepository.listByUsuario(usuarioId);
    return { perfis: perfis.map(formatarPerfil) };
  }
}