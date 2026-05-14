import fastifyJwt from "@fastify/jwt";
import fastifyCors from "@fastify/cors";
import { fastify } from "fastify";
import { env } from "./env";
import { usuariosRoutes } from "./controllers/usuarios/routes";
import { pagamentosRoutes } from "./controllers/pagamentos/routes";
import { receitasRoutes } from "./controllers/receitas/routes";
import { despesasRoutes } from "./controllers/despesas/routes";
import { cartoesRoutes } from "./controllers/cartoes/routes";
import { dashboardRoutes } from "./controllers/dashboard/routes";

export const app = fastify();

const frontendOrigin = env.FRONTEND_URL.replace(/\/$/, "");
const allowedOrigins = new Set([
  "http://localhost:5173",
  "localhost:5173",
  frontendOrigin,
]);

app.register(fastifyCors, {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin not allowed by CORS"), false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
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

app.register(usuariosRoutes, { prefix: "/api" });
app.register(pagamentosRoutes, { prefix: "/api" });
app.register(receitasRoutes, { prefix: "/api" });
app.register(despesasRoutes, { prefix: "/api" });
app.register(cartoesRoutes, { prefix: "/api" });
app.register(dashboardRoutes, { prefix: "/api" });
