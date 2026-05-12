import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { env } from "../../env";
import { verifyMercadoPagoSignature } from "../../lib/mercadopago-webhook";
import { ProcessarWebhookMercadoPagoUseCase } from "../../use-cases/pagamentos/processar-webhook-mercado-pago-usecase";

const webhookQuerySchema = z.object({
  "data.id": z.string().optional(),
  id: z.string().optional(),
  topic: z.string().optional(),
  type: z.string().optional(),
});

const webhookBodySchema = z.object({
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
  const query = webhookQuerySchema.parse(request.query);
  const body = webhookBodySchema.parse(request.body ?? {});
  const paymentId = query["data.id"] ?? query.id ?? body.data?.id?.toString();

  if (!paymentId) {
    return reply.status(400).send({ message: "Pagamento nao informado" });
  }

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
    console.warn("MERCADO_PAGO_WEBHOOK_SECRET nao configurado");
  }

  const processarWebhookMercadoPago = new ProcessarWebhookMercadoPagoUseCase();
  await processarWebhookMercadoPago.execute({ paymentId });

  return reply.status(200).send({ received: true });
}
