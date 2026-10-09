import 'dotenv/config';
import { createServer } from './server';

async function start(): Promise<void> {
  const server = await createServer();
  await server.start();
  console.log(`API disponible en ${server.info.uri}`);
}

start().catch((error: unknown) => {
  console.error('No se pudo iniciar la API:', error);
  process.exitCode = 1;
});
