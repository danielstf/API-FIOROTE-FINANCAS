import { app } from "../../app";
import { prisma } from "../../lib/prisma";
import { vi } from "vitest";
import { TEST_USER_ID, TEST_ADMIN_ID, TEST_SESSION_ID } from "./factories";

export function createUserToken(
  userId = TEST_USER_ID,
  sessionId = TEST_SESSION_ID,
): string {
  return app.jwt.sign({ sub: userId, role: "USER", sid: sessionId });
}

export function createAdminToken(
  userId = TEST_ADMIN_ID,
  sessionId = TEST_SESSION_ID,
): string {
  return app.jwt.sign({ sub: userId, role: "ADMIN", sid: sessionId });
}

export function bearerHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// Configura o mock da sessão para simular uma sessão válida
export function mockValidSession() {
  vi.mocked(prisma.sessaoUsuario.updateMany).mockResolvedValue({ count: 1 });
}

// Configura o mock da sessão para simular sessão expirada/inválida
export function mockInvalidSession() {
  vi.mocked(prisma.sessaoUsuario.updateMany).mockResolvedValue({ count: 0 });
}
