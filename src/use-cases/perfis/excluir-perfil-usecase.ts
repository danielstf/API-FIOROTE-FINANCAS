import { PerfilRepository } from "../../repositories/repository/perfis/perfil-repository";
import { PerfilNaoEncontradoError } from "./perfil-erros";

export class ExcluirPerfilUseCase {
  constructor(private perfilRepository: PerfilRepository) {}

  async execute(usuarioId: string, perfilId: string) {
    const atual = await this.perfilRepository.findByIdAndUsuario(perfilId, usuarioId);
    if (!atual) throw new PerfilNaoEncontradoError();

    await this.perfilRepository.delete(perfilId);
  }
}