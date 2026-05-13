import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { env } from "../../env";
import { verifyMercadoPagoSignature } from "../../lib/mercadopago-webhook";
import { ProcessarWebhookMercadoPagoUseCase } from "../../use-cases/pagamentos/processar-webhook-mercado-pago-usecase";

const webhookQuerySchema = z.object({
  // O Mercado Pago pode enviar o id do pagamento por query em formatos diferentes.
  "data.id": z.string().optional(),
  id: z.string().optional(),
  topic: z.string().optional(),
  type: z.string().optional(),
});

const webhookBodySchema = z.object({
  // Alguns eventos enviam o id dentro do corpo da requisicao.
  type: z.string().optional(),
  action: z.string().optional(),
  data: z
    .object({
      id: z.union([z.string(), z.number()]),
    })
    .optional(),
});

export async function webhookMercadoPagoController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  // Valida query/body antes de extrair o id do pagamento.
  const query = webhookQuerySchema.parse(request.query);
  const body = webhookBodySchema.parse(request.body ?? {});

  // Prioriza os campos mais comuns usados pelo Mercado Pago para identificar o pagamento.
  const paymentId = query["data.id"] ?? query.id ?? body.data?.id?.toString();

  if (!paymentId) {
    return reply.status(400).send({ message: "Pagamento nao informado" });
  }

  // Quando configurado, valida a assinatura para garantir que o webhook veio do Mercado Pago.
  if (env.MERCADO_PAGO_WEBHOOK_SECRET) {
    const isValidSignature = verifyMercadoPagoSignature({
      dataId: query["data.id"] ?? paymentId,
      requestId: request.headers["x-request-id"]?.toString(),
      signature: request.headers["x-signature"]?.toString(),
      secret: env.MERCADO_PAGO_WEBHOOK_SECRET,
    });

    if (!isValidSignature) {
      return reply.status(401).send({ message: "Assinatura invalida" });
    }
  } else {
    // Mantem o webhook funcionando em ambientes sem segredo, mas alerta no log.
    console.warn("MERCADO_PAGO_WEBHOOK_SECRET nao configurado");
  }

  // Consulta o pagamento no Mercado Pago e aplica o resultado no banco local.
  const processarWebhookMercadoPago = new ProcessarWebhookMercadoPagoUseCase();
  await processarWebhookMercadoPago.execute({ paymentId });

  return reply.status(200).send({ received: true });
}
