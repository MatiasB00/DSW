import Boom from '@hapi/boom';
import { Request, ResponseToolkit } from '@hapi/hapi';
import Joi from 'joi';
import { Readable } from 'node:stream';
import * as orders from '../models/orderModel';
import { getAuthCredentials } from '../auth/jwtAuth';
import { PRINTING_SIZES } from '../shared/printingSizes';

const MAX_PRINT_FILE_BYTES = 20 * 1024 * 1024;
const printOrderPayloadSchema = Joi.object({
  tamanio: Joi.string().valid(...PRINTING_SIZES).required(),
  tipoColor: Joi.string().valid('blanco y negro', 'color').required(),
  faz: Joi.string().valid('simple', 'doble').required(),
  cantCopias: Joi.number().integer().min(1).max(4294967295).required(),
  observacion: Joi.string().max(2000).allow('').default(''),
  archivo: Joi.any().required(),
}).unknown(false);

interface UploadedPdf extends Readable {
  hapi?: {
    filename?: string;
  };
}

async function validatePdf(upload: UploadedPdf): Promise<void> {
  if (!upload.hapi?.filename || !/\.pdf$/i.test(upload.hapi.filename)) {
    throw Boom.badRequest('El archivo adjunto debe tener extensión .pdf.');
  }

  let totalBytes = 0;
  let header = Buffer.alloc(0);
  for await (const chunk of upload) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += bytes.length;
    if (totalBytes > MAX_PRINT_FILE_BYTES) {
      throw Boom.entityTooLarge('El archivo PDF no puede superar los 20 MB.');
    }
    if (header.length < 1024) {
      header = Buffer.concat([header, bytes.subarray(0, 1024 - header.length)]);
    }
  }

  if (totalBytes < 5 || header.indexOf(Buffer.from('%PDF-')) === -1) {
    throw Boom.badRequest('El archivo enviado no parece ser un documento PDF válido.');
  }
}

export async function findAll(request: Request, h: ResponseToolkit) {
  const credentials = getAuthCredentials(request.auth.credentials);
  const userId = credentials.rol === 'admin' ? undefined : credentials.IDUsuario;
  return h.response(await orders.findAll(userId)).code(200);
}

export async function findOne(request: Request, h: ResponseToolkit) {
  const credentials = getAuthCredentials(request.auth.credentials);
  const order = await orders.findOne(Number(request.params.id));
  if (!order) throw Boom.notFound('No se encontró el pedido solicitado.');
  if (credentials.rol !== 'admin' && order.IDUsuario !== credentials.IDUsuario) {
    throw Boom.notFound('No se encontró el pedido solicitado.');
  }
  return h.response(order).code(200);
}

export async function create(request: Request, h: ResponseToolkit) {
  const credentials = getAuthCredentials(request.auth.credentials);
  const payload = request.payload as Omit<orders.CreateOrderInput, 'IDUsuario'>;
  const id = await orders.create({ ...payload, IDUsuario: credentials.IDUsuario });
  const order = await orders.findOne(id);
  return h.response(order).code(201);
}

export async function createPrint(request: Request, h: ResponseToolkit) {
  const credentials = getAuthCredentials(request.auth.credentials);
  const validation = printOrderPayloadSchema.validate(request.payload, {
    abortEarly: false,
    convert: true,
  });
  if (validation.error) {
    throw Boom.badRequest(validation.error.message);
  }

  const { archivo, ...details } = validation.value as {
    archivo: UploadedPdf;
    tamanio: string;
    tipoColor: 'blanco y negro' | 'color';
    faz: 'simple' | 'doble';
    cantCopias: number;
    observacion: string;
  };
  await validatePdf(archivo);
  const id = await orders.create({
    IDUsuario: credentials.IDUsuario,
    tipo: 'impresion',
    impresion: details,
  });
  return h.response(await orders.findOne(id)).code(201);
}

export async function update(request: Request, h: ResponseToolkit) {
  const { estado } = request.payload as { estado: orders.OrderStatus };
  const updated = await orders.update(
    Number(request.params.id),
    estado,
  );
  if (!updated) throw Boom.notFound('No se encontró el pedido solicitado.');
  return h.response(await orders.findOne(Number(request.params.id))).code(200);
}
