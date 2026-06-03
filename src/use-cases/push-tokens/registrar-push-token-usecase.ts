import { UsuarioNaoEncontradoError } from "../../errors/app-errors";
import { PushTokenRepositoryInterface } from "../../repositories/interface/push-tokens/push-token-repo-interface";
import { UsuarioRepositoryInterface } from "../../repositories/interface/usuarios/usuario-repo-interface";

export { UsuarioNaoEncontradoError };

interface RegistrarPushTokenRequest {
  usuarioId: string;
  token: string;
}

export class RegistrarPushTokenUseCase {
  constructor(
    private pushTokenRepository: PushTokenRepositoryInterface,
    private usuarioRepository: UsuarioRepositoryInterface,
  ) {}

  async execute({ usuarioId, token }: RegistrarPushTokenRequest): Promise<void> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario) throw new UsuarioNaoEncontradoError();
    await this.pushTokenRepository.upsert(usuarioId, token);
  }
}
