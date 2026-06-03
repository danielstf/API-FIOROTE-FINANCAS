export interface PushTokenRepositoryInterface {
  upsert(usuarioId: string, token: string): Promise<void>;
}
