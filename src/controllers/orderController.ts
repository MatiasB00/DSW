import Boom from '@hapi/boom';
import { Request, ResponseToolkit } from '@hapi/hapi';
import * as orders from '../models/orderModel';
import { getAuthCredentials } from '../auth/jwtAuth';

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

export async function update(request: Request, h: ResponseToolkit) {
  const { estado } = request.payload as { estado: orders.OrderStatus };
  const updated = await orders.update(
    Number(request.params.id),
    estado,
  );
  if (!updated) throw Boom.notFound('No se encontró el pedido solicitado.');
  return h.response(await orders.findOne(Number(request.params.id))).code(200);
}
