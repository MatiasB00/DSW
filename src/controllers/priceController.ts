import { Request, ResponseToolkit } from '@hapi/hapi';
import * as priceModel from '../models/priceModel';

export async function getHistorial(request: Request, h: ResponseToolkit) {
    const idProducto = Number(request.params.id);
    const historial = await priceModel.getHistorial(idProducto);
    return h.response(historial).code(200);
}

export async function create(request: Request, h: ResponseToolkit) {
    const idProducto = Number(request.params.id);
    const payload = request.payload as { valor: number };

    await priceModel.registrarNuevoPrecio(idProducto, payload.valor);
    return h.response({ message: 'Precio registrado con éxito.' }).code(201);
}
