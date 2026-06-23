import { app } from "./app";
import { env } from "./env";
import { schedule } from "node-cron";
import { executarNotificacoesVencimento } from "./jobs/notificacoes-vencimento";
import { executarLimpezaPagamentosPendentes } from "./jobs/limpar-pagamentos-pendentes";

// Dispara todo dia às 09:00 horário de Brasília
schedule("0 9 * * *", () => {
  executarNotificacoesVencimento().catch(console.error);
}, { timezone: "America/Sao_Paulo" });

// Limpeza semanal de pagamentos PENDING (+30 dias) e CANCELLED (+90 dias) — toda domingo às 03:00
schedule("0 3 * * 0", () => {
  executarLimpezaPagamentosPendentes().catch(console.error);
}, { timezone: "America/Sao_Paulo" });

app
  .listen({ port: env.PORT, host: "0.0.0.0" })
  .then(() => console.log(`Server listening in http://localhost:${env.PORT}`));
