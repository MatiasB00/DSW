# Propuesta TP DSW

## Grupo
### Integrantes
* 48009 - Matias Bilicich
* 50301 - Franco Sartirana

### Repositorios
* [monorepo](https://github.com/MatiasB00/DSW)

## Tema
### Descripción
Portal web de un comercio de imporenta mayorista, desde el cual se pueden crear y gestionar pedidos, tanto de insumos como de impresion.


### Modelo

<img width="1247" height="562" alt="image" src="https://github.com/user-attachments/assets/3c586559-a8ef-4b44-8648-9099f79d0e9d" />


## Alcance Funcional 

### Alcance Mínimo

Regularidad:
|Req|Detalle|
|:-|:-|
|CRUD simple|1. CRUD Usuario<br>2. CRUD Proveedores<br>3. CRUD Productos|
|CRUD dependiente|1. CRUD Pedido {depende de} CRUD Usuario<br>2. CRUD Precio {depende de} CRUD Producto|
|Listado<br>+<br>detalle| 1. Listado de productos filtrado por nombre, muestra precio, nombre y descripcion => detalle CRUD Habitacion<br> 2. Listado de proveedores, buscables por razon social o CUIT => se muestra el proveedor con sus datos y respectivos botones.|
|CUU/Epic|1. Registro de un usuario<br>2. Agregar productos al carrito|


Adicionales para Aprobación
|Req|Detalle|
|:-|:-|
|CRUD |1. CRUD Usuario<br>2. CRUD Proveedores<br>3. CRUD Productos<br>4. CRUD Precio<br>5. CRUD Pedido<br>6. CRUD Contacto<br>|
|CUU/Epic|1. Registro de un usuario<br>2. Agregar productos al carrito?<br>3. Realizar el check-out y facturación de pedido completo|


### Alcance Adicional Voluntario

|Req|Detalle|
|:-|:-|
|Listados |1. En panel admin, filtrado de proveedores por nombre. <br>2. En portal de cliente, listado de pedidos anteriores con detalle, filtrables por id, tipo y precio.|
|CUU/Epic|1. Consumir servicios<br>2. Cancelación de pedido|
|Otros|1. Envío de recordatorio de reserva por email|

