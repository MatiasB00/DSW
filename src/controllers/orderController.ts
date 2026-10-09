import Boom from '@hapi/boom';
import { Request, ResponseToolkit } from '@hapi/hapi';
import * as orders from '../models/orderModel';

export async function list(_request: Request, h: ResponseToolkit) {
  return h.response(await orders.list()).code(200);
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

export async function update(request: Request, h: ResponseToolkit) {
  const updated = await orders.update(
    Number(request.params.id),
    request.payload as orders.UpdateOrderInput,
  );
  if (!updated) throw Boom.notFound('No se encontró el pedido solicitado.');
  return h.response(await orders.find(Number(request.params.id))).code(200);
}

export async function remove(request: Request, h: ResponseToolkit) {
  const removed = await orders.remove(Number(request.params.id));
  if (!removed) throw Boom.notFound('No se encontró el pedido solicitado.');
  return h.response().code(204);
}

export async function addItem(request: Request, h: ResponseToolkit) {
  await orders.addItem(
    Number(request.params.id),
    request.payload as orders.OrderItemInput,
  );
  return h.response(await orders.find(Number(request.params.id))).code(201);
}

export async function updateItem(request: Request, h: ResponseToolkit) {
  await orders.updateItem(
    Number(request.params.id),
    Number(request.params.productoId),
    (request.payload as { cantidad: number }).cantidad,
  );
  return h.response(await orders.find(Number(request.params.id))).code(200);
}

export async function removeItem(request: Request, h: ResponseToolkit) {
  await orders.removeItem(
    Number(request.params.id),
    Number(request.params.productoId),
  );
  return h.response(await orders.find(Number(request.params.id))).code(200);
}

export async function updatePrintDetails(request: Request, h: ResponseToolkit) {
  await orders.updatePrintDetails(
    Number(request.params.id),
    request.payload as orders.UpdatePrintOrderInput,
  );
  return h.response(await orders.find(Number(request.params.id))).code(200);
}
