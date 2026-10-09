import Hapi from '@hapi/hapi';
import { closeDatabase } from './db';
import { routes } from './routes';

export async function createServer(): Promise<Hapi.Server> {
  const server = Hapi.server({
    port: Number(process.env.PORT ?? 3000),
    host: 'localhost',
    routes: {
      validate: { options: { abortEarly: false, convert: true } },
    },
  });
  server.route(routes);
  server.events.on('request', (request, event) => {
    if (event.error) {
      console.error(
        `Error en ${request.method.toUpperCase()} ${request.path}: ${
          event.error instanceof Error ? event.error.message : String(event.error)
        }`,
      );
    }
  });
  server.ext('onPostStop', async () => closeDatabase());
  return server;
}
