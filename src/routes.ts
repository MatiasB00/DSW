import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';
import * as orderController from './controllers/orderController';
import * as priceController from './controllers/priceController';
import * as authController from './controllers/authController';
import * as userController from './controllers/userController';
import * as productController from './controllers/productController';
import * as providerController from './controllers/providerController'

const idParams = Joi.object({
  id: Joi.number().integer().positive().max(4294967295).required(),
});

const itemParams = Joi.object({
  id: Joi.number().integer().positive().max(4294967295).required(),
  productoId: Joi.number().integer().positive().max(4294967295).required(),
});

const usuarioSchema = Joi.object({
  nombre: Joi.string().trim().min(1).max(100).required(),
  apellido: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().trim().email().max(254).required(),
  contraseniaHash: Joi.string().trim().min(6).max(20).required(),
  rol: Joi.string().trim().min(1).max(30).required(),
});

const registroSchema = Joi.object({
  nombre: Joi.string().trim().min(1).max(100).required(),
  apellido: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().trim().email().max(254).required(),
  contrasenia: Joi.string().trim().min(6).max(128).required(),
  rol: Joi.string().valid('admin', 'cliente').optional(),
})

const loginSchema = Joi.object({
  email: Joi.string().trim().email().max(254).required(),
  contrasenia: Joi.string().required(),
})


const proveedorSchema = Joi.object({
  cuit: Joi.string().trim().min(1).max(20).required(),
  razonSocial: Joi.string().trim().min(1).max(150).required(),
  email: Joi.string().trim().email().max(254).required(),
  telefono: Joi.string().trim().max(50).allow('', null).optional(),
  direccion: Joi.string().trim().max(255).allow('', null).optional(),
});

const productoSchema = Joi.object({
  nombre: Joi.string().trim().min(1).max(150).required(),
  descripcion: Joi.string().allow('').required(),
  IDProveedor: Joi.number().integer().positive().allow(null).optional(),
});

const precioSchema = Joi.object({
  valor: Joi.number().precision(2).min(0).max(9999999999.99).required(),
});

const orderFields = {
  IDUsuario: Joi.number().integer().positive().max(4294967295).required(),
  fecha: Joi.string().isoDate().optional(),
  estado: Joi.string().trim().min(1).max(30).required(),
};

const itemSchema = Joi.object({
  IDProducto: Joi.number().integer().positive().max(4294967295).required(),
  cantidad: Joi.number().integer().positive().max(4294967295).required(),
});

const printDetailsSchema = Joi.object({
  cantCopias: Joi.number().integer().positive().max(4294967295).required(),
  faz: Joi.string().trim().min(1).max(30).required(),
  tamanio: Joi.string().trim().min(1).max(50).required(),
  archivo: Joi.string().trim().min(1).max(2048).required(),
  observacion: Joi.string().allow('', null).optional(),
  subtotal: Joi.number().precision(2).min(0).max(9999999999.99).required(),
});

const orderSchema = Joi.alternatives().try(
  Joi.object({
    ...orderFields,
    tipo: Joi.string().valid('insumo').required(),
    items: Joi.array().items(itemSchema).min(1).required(),
    impresion: Joi.forbidden(),
  }),
  Joi.object({
    ...orderFields,
    tipo: Joi.string().valid('impresion').required(),
    impresion: printDetailsSchema.required(),
    items: Joi.forbidden(),
  }),
);

const updateOrderSchema = Joi.object({
  IDUsuario: Joi.number().integer().positive().max(4294967295),
  fecha: Joi.string().isoDate(),
  estado: Joi.string().trim().min(1).max(30),
}).min(1);

const quantitySchema = Joi.object({
  cantidad: Joi.number().integer().positive().max(4294967295).required(),
});

const updatePrintSchema = Joi.object({
  cantCopias: Joi.number().integer().positive().max(4294967295),
  faz: Joi.string().trim().min(1).max(30),
  tamanio: Joi.string().trim().min(1).max(50),
  archivo: Joi.string().trim().min(1).max(2048),
  observacion: Joi.string().allow('', null),
  subtotal: Joi.number().precision(2).min(0).max(9999999999.99),
}).min(1);

export const routes: ServerRoute[] = [
  {
    method: 'POST',
    path: '/api/auth/register',
    options: { validate: { payload: registroSchema } },
    handler: authController.register,
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    options: { validate: { payload: loginSchema } },
    handler: authController.login,
  },

  {
    method: 'GET',
    path: '/api/proveedores',
    handler: providerController.list()
  },

  {
    method: 'GET',
    path: '/api/proveedores/{id}',
    options: { validate : { params: idParams } },
    handler: providerController.get()
  },

  {
    method: 'POST',
    path: '/api/proveedores',
    options: { validate: { payload: proveedorSchema} },
    handler: providerController.create()
  },

  {
    method: 'PUT',
    path: '/api/proveedores/{id}',
    options: { validate: {params: idParams, payload: proveedorSchema} },
    handler: providerController.update()
  },

  {
    method: 'DELETE',
    path: '/api/proveedores/{id}',
    options: { validate: { params: idParams } },
    handler: providerController.remove()
  },

{
    method: 'GET',
    path: '/api/usuarios',
    handler: userController.list()
  },

  {
    method: 'GET',
    path: '/api/usuarios/{id}',
    options: { validate : { params: idParams } },
    handler: userController.get()
  },

  {
    method: 'POST',
    path: '/api/usuarios',
    options: { validate: { payload: usuarioSchema} },
    handler: userController.create()
  },

  {
    method: 'PUT',
    path: '/api/usuarios/{id}',
    options: { validate: {params: idParams, payload: usuarioSchema} },
    handler: userController.update()
  },

  {
    method: 'DELETE',
    path: '/api/usuarios/{id}',
    options: { validate: { params: idParams } },
    handler: userController.remove()
  },

  {
    method: 'GET',
    path: '/api/productos',
    handler: productController.list()
  },

  {
    method: 'GET',
    path: '/api/productos/{id}',
    options: { validate : { params: idParams } },
    handler: productController.get()
  },

  {
    method: 'POST',
    path: '/api/productos',
    options: { validate: { payload: productoSchema} },
    handler: productController.create()
  },

  {
    method: 'PUT',
    path: '/api/productos/{id}',
    options: { validate: {params: idParams, payload: productoSchema} },
    handler: productController.update()
  },

  {
    method: 'DELETE',
    path: '/api/productos/{id}',
    options: { validate: { params: idParams } },
    handler: productController.remove()
  },

  {
    method: 'GET',
    path: '/api/pedidos',
    handler: orderController.list
  },
  {
    method: 'GET',
    path: '/api/productos/{id}/precios',
    options: { validate: { params: idParams } },
    handler: priceController.getHistorial,
  },
  {
    method: 'POST',
    path: '/api/productos/{id}/precios',
    options: { validate: { params: idParams, payload: precioSchema } },
    handler: priceController.create,
  },
  {
    method: 'GET',
    path: '/api/pedidos/{id}',
    options: { validate: { params: idParams } },
    handler: orderController.get,
  },
  {
    method: 'POST',
    path: '/api/pedidos',
    options: { validate: { payload: orderSchema } },
    handler: orderController.create,
  },
  {
    method: 'PATCH',
    path: '/api/pedidos/{id}',
    options: { validate: { params: idParams, payload: updateOrderSchema } },
    handler: orderController.update,
  },
  {
    method: 'DELETE',
    path: '/api/pedidos/{id}',
    options: { validate: { params: idParams } },
    handler: orderController.remove,
  },
  {
    method: 'PATCH',
    path: '/api/pedidos/{id}/impresion',
    options: { validate: { params: idParams, payload: updatePrintSchema } },
    handler: orderController.updatePrintDetails,
  },
  {
    method: 'POST',
    path: '/api/pedidos/{id}/items',
    options: { validate: { params: idParams, payload: itemSchema } },
    handler: orderController.addItem,
  },
  {
    method: 'PATCH',
    path: '/api/pedidos/{id}/items/{productoId}',
    options: { validate: { params: itemParams, payload: quantitySchema } },
    handler: orderController.updateItem,
  },
  {
    method: 'DELETE',
    path: '/api/pedidos/{id}/items/{productoId}',
    options: { validate: { params: itemParams } },
    handler: orderController.removeItem,
  },
];
