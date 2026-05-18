import { PerfilRepository } from "../../repositories/repository/perfis/perfil-repository";
import { UsuarioRepositoryInterface } from "../../repositories/interface/usuarios/usuario-repo-interface";
import { formatarPerfil } from "./perfil-dados";
import { LimitePerfisError, PlanoPremiumObrigatorioError } from "./perfil-erros";

interface Request {
  usuarioId: string;
  nome: string;
  avatar: string;
  tema: string;
}

export class CriarPerfilUseCase {
  constructor(
    private perfilRepository: PerfilRepository,
    private usuarioRepository: UsuarioRepositoryInterface,
  ) {}

  async execute({ usuarioId, nome, avatar, tema }: Request) {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario || usuario.plano !== "PREMIUM") throw new PlanoPremiumObrigatorioError();

    const total = await this.perfilRepository.countByUsuario(usuarioId);
    if (total >= 5) throw new LimitePerfisError();

    const perfil = await this.perfilRepository.create({
      usuarioId,
      nome: nome.trim(),
      avatar,
      tema,
    });

    return formatarPerfil(perfil);
  }
}