import { loadEnv } from "./config/env";
import { createContainer } from "./presentation/container";
import { createApp } from "./presentation/http/app";

const env = loadEnv();
const container = createContainer(env);
const app = createApp(container, env);

app.listen({ port: env.API_PORT, hostname: env.API_HOST }, ({ hostname, port }) => {
  console.log(`🚀 Infokes API listening on http://${hostname}:${port}`);
  console.log(`📘 Swagger UI:    http://${hostname}:${port}/swagger`);
  console.log(`🩺 Health check:  http://${hostname}:${port}/healthz`);
});
