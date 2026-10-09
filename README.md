# API de imprenta mayorista

Backend REST en Node.js, TypeScript, Hapi, Joi y MySQL. La lógica HTTP está en `controllers`, las consultas y transacciones en `models`, y las rutas/esquemas de entrada en `routes`.

## Puesta en marcha

1. Crear el esquema ejecutando `database/schema.sql` con MySQL 8.0.16 o superior.
2. Copiar `.env.example` a `.env` y completar las credenciales.
3. Ejecutar `npm install`.
4. Ejecutar `npm run dev` para desarrollo, o `npm run build` y luego `npm start`.

El servidor escucha en `http://localhost:3000` por defecto. Los campos monetarios usan `DECIMAL(12,2)`. `rol` y `estado` son cadenas para permitir que el negocio defina sus propios valores.

## API

Todos los endpoints están bajo `/api`.

| Recurso | Operaciones |
| --- | --- |
| `/usuarios` | GET lista, GET `/{id}`, POST, PUT `/{id}`, DELETE `/{id}` |
| `/productos` | GET lista, GET `/{id}`, POST, PUT `/{id}`, DELETE `/{id}` |
| `/pedidos` | GET lista, GET `/{id}`, POST, PATCH `/{id}`, DELETE `/{id}` |
| `/pedidos/{id}/items` | POST para agregar un producto a un pedido de insumos |
| `/pedidos/{id}/items/{productoId}` | PATCH para cambiar cantidad, DELETE para quitar producto |
| `/pedidos/{id}/impresion` | PATCH para actualizar los datos de un pedido de impresión |

Crear un pedido requiere `tipo: "insumo"` con al menos un elemento en `items`, o `tipo: "impresion"` con sus datos específicos en `impresion`. El backend crea pedido y subtipo en la misma transacción y calcula `total`; para insumos obtiene el precio vigente del producto. No se permite borrar el último producto de un pedido de insumos.

Ejemplo de pedido de insumos:

```json
{
  "IDUsuario": 1,
  "estado": "pendiente",
  "tipo": "insumo",
  "items": [{ "IDProducto": 1, "cantidad": 20 }]
}
```

Ejemplo de pedido de impresión:

```json
{
  "IDUsuario": 1,
  "estado": "pendiente",
  "tipo": "impresion",
  "impresion": {
    "cantCopias": 100,
    "faz": "doble",
    "tamanio": "A4",
    "archivo": "https://ejemplo.test/documento.pdf",
    "observacion": "",
    "subtotal": 2500
  }
}
```

La base de datos mantiene las claves foráneas y restricciones locales; la regla de especialización total y disjunta (exactamente un subtipo por pedido) se asegura en la creación transaccional de la API, ya que MySQL no admite restricciones diferibles entre tablas.

Los identificadores son autoincrementales. Los pedidos no permiten cambiar de subtipo al actualizarlos. El borrado de un usuario con pedidos o de un producto que aparece en pedidos se rechaza por integridad referencial.
