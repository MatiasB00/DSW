import Boom from '@hapi/boom';
import { Request, ResponseToolkit } from '@hapi/hapi';
import * as printingPrices from '../models/printingPriceModel';

export async function findAll(_request: Request, h: ResponseToolkit) {
  return h.response(await printingPrices.findAll()).code(200);
}

export async function create(request: Request, h: ResponseToolkit) {
  await printingPrices.create(request.payload as printingPrices.PrintingPriceInput);
  return h.response({ message: 'Precio de impresión creado.' }).code(201);
}

export async function update(request: Request, h: ResponseToolkit) {
  const { tamanio, fechaDesde } = request.params as {
    tamanio: string;
    fechaDesde: string;
  };
  const updated = await printingPrices.update(
    tamanio,
    fechaDesde,
    request.payload as printingPrices.PrintingPriceInput,
  );
  if (!updated) throw Boom.notFound('No se encontró el precio de impresión solicitado.');
  return h.response({ message: 'Precio de impresión actualizado.' }).code(200);
}
