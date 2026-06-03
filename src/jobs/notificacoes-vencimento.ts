import { ExpoPushMessage } from "expo-server-sdk";
import { prisma } from "../lib/prisma";
import { criarMensagemPush, enviarMensagens } from "../lib/expo-push";

function formatarValor(valor: { toString(): string }): string {
  return `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;
}

function inicioDia(data: Date): Date {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fimDia(data: Date): Date {
  const d = new Date(data);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function executarNotificacoesVencimento(): Promise<void> {
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);

  const [despesasHoje, despesasOntem] = await Promise.all([
    prisma.despesa.findMany({
      where: {
        paga: false,
        dataVencimento: { gte: inicioDia(hoje), lte: fimDia(hoje) },
      },
      include: { usuario: { include: { pushTokens: true } } },
    }),
    prisma.despesa.findMany({
      where: {
        paga: false,
        dataVencimento: { gte: inicioDia(ontem), lte: fimDia(ontem) },
      },
      include: { usuario: { include: { pushTokens: true } } },
    }),
  ]);

  const mensagens: ExpoPushMessage[] = [];

  for (const despesa of despesasHoje) {
    for (const { token } of despesa.usuario.pushTokens) {
      const msg = criarMensagemPush(
        token,
        "Conta vence hoje — Fiorote",
        `"${despesa.descricao}" · ${formatarValor(despesa.valor)}`,
        { screen: "despesas" },
      );
      if (msg) mensagens.push(msg);
    }
  }

  for (const despesa of despesasOntem) {
    for (const { token } of despesa.usuario.pushTokens) {
      const msg = criarMensagemPush(
        token,
        "Conta vencida — Fiorote",
        `"${despesa.descricao}" venceu ontem · ${formatarValor(despesa.valor)}`,
        { screen: "despesas" },
      );
      if (msg) mensagens.push(msg);
    }
  }

  await enviarMensagens(mensagens);

  if (mensagens.length > 0) {
    console.log(`[notificacoes] ${mensagens.length} notificação(ões) enviada(s)`);
  }
}
