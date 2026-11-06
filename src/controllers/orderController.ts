import Boom from '@hapi/boom';
import { Request, ResponseToolkit } from '@hapi/hapi';
import * as orders from '../models/orderModel';

export async function list(request: Request, h: ResponseToolkit) {
  const userId = request.query.userId ? Number(request.query.userId) : undefined;
  return h.response(await orders.list(userId)).code(200);
}

export async function get(request: Request, h: ResponseToolkit) {
  const order = await orders.find(Number(request.params.id));
  if (!order) throw Boom.notFound('No se encontró el pedido solicitado.');
  return h.response(order).code(200);
}

export async function create(request: Request, h: ResponseToolkit) {
  const id = await orders.create(request.payload as orders.CreateOrderInput);
  const order = await orders.find(id);
  return h.response(order).code(201);
}

export async function updateStatus(request: Request, h: ResponseToolkit) {
  const { estado } = request.payload as { estado: orders.OrderStatus };
  const updated = await orders.update(
    Number(request.params.id),
    estado,
  );
  if (!updated) throw Boom.notFound('No se encontró el pedido solicitado.');
  return h.response(await orders.find(Number(request.params.id))).code(200);
}
