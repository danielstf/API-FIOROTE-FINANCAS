import { PushTokenRepository } from "../../repositories/repository/push-tokens/push-token-repository";
import { UsuarioRepository } from "../../repositories/repository/usuarios/usuario-repository";
import { RegistrarPushTokenUseCase } from "../../use-cases/push-tokens/registrar-push-token-usecase";

export function makeRegistrarPushTokenFactory() {
  return new RegistrarPushTokenUseCase(
    new PushTokenRepository(),
    new UsuarioRepository(),
  );
}
