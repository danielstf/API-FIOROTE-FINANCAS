import { prisma } from "../../../lib/prisma";
import { PushTokenRepositoryInterface } from "../../interface/push-tokens/push-token-repo-interface";

export class PushTokenRepository implements PushTokenRepositoryInterface {
  async upsert(usuarioId: string, token: string): Promise<void> {
    await prisma.pushToken.upsert({
      where: { token },
      update: { usuarioId },
      create: { usuarioId, token },
    });
  }
}
