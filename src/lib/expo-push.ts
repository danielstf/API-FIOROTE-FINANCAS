import { Expo, ExpoPushMessage } from "expo-server-sdk";

export const expo = new Expo();

export function criarMensagemPush(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): ExpoPushMessage | null {
  if (!Expo.isExpoPushToken(token)) return null;
  return { to: token, title, body, sound: "default", data: data ?? {} };
}

export async function enviarMensagens(mensagens: ExpoPushMessage[]): Promise<void> {
  if (mensagens.length === 0) return;
  const chunks = expo.chunkPushNotifications(mensagens);
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk).catch(console.error);
  }
}
