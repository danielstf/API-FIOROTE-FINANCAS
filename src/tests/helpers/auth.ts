/// <reference types="vitest/globals" />
import { app } from "../../app";
import { prisma } from "../../lib/prisma";

export const TEST_USER_ID = "user-id-test-123";
export const TEST_ADMIN_ID = "admin-id-test-456";
export const TEST_PREMIUM_USER_ID = "premium-id-test-789";
export const TEST_SESSION_ID = "session-id-test-abc";

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

export function mockValidSession() {
  vi.mocked(prisma.sessaoUsuario.updateMany).mockResolvedValue({ count: 1 });
}

export function mockInvalidSession() {
  vi.mocked(prisma.sessaoUsuario.updateMany).mockResolvedValue({ count: 0 });
}
