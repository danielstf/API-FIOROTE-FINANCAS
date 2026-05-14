import fastifyJwt from "@fastify/jwt";
import fastifyHelmet from "@fastify/helmet";
import fastifyCors from "@fastify/cors";
import fastifyRateLimit from "@fastify/rate-limit";
import { fastify } from "fastify";
import { ZodError } from "zod";
import { env } from "./env";
import { usuariosRoutes } from "./controllers/usuarios/routes";
import { pagamentosRoutes } from "./controllers/pagamentos/routes";
import { receitasRoutes } from "./controllers/receitas/routes";
import { despesasRoutes } from "./controllers/despesas/routes";
import { cartoesRoutes } from "./controllers/cartoes/routes";
import { dashboardRoutes } from "./controllers/dashboard/routes";

export const app = fastify();

const allowedOrigins = new Set([
  "http://localhost:5173",
  "localhost:5173",
  env.FRONTEND_URL,
]);

app.register(fastifyHelmet);

app.register(fastifyRateLimit, {
  global: true,
  max: 300,
  timeWindow: "1 minute",
  errorResponseBuilder() {
    return { message: "Muitas requisicoes. Tente novamente em instantes." };
  },
});

app.register(fastifyCors, {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
});

app.setErrorHandler((error, _request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: "Dados invalidos",
      errors: error.flatten().fieldErrors,
    });
  }

  const statusCode =
    typeof error === "object" && error !== null && "statusCode" in error
      ? Number(error.statusCode)
      : undefined;

  if (statusCode === 429) {
    return reply.status(429).send({
      message: "Muitas requisicoes. Tente novamente em instantes.",
    });
  }

  console.error(error);
  return reply.status(500).send({ message: "Erro interno do servidor" });
});

app.get("/", async () => {
  return { status: "ok", service: "api-fiorote-financas" };
});

app.get("/health", async () => {
  return { status: "ok" };
});

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  sign: {
    expiresIn: "24h",
  },
});

app.register(usuariosRoutes);
app.register(pagamentosRoutes);
app.register(receitasRoutes);
app.register(despesasRoutes);
app.register(cartoesRoutes);
app.register(dashboardRoutes);
