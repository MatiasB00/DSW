CREATE DATABASE IF NOT EXISTS imprenta_mayorista
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE imprenta_mayorista;

CREATE TABLE IF NOT EXISTS Usuario (
  IDUsuario INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  rol VARCHAR(30) NOT NULL,
  PRIMARY KEY (IDUsuario),
  UNIQUE KEY uq_usuario_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Proveedor (
  IDProveedor INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cuit VARCHAR(20) NOT NULL,
  razonSocial VARCHAR(150) NOT NULL,
  email VARCHAR(254) NOT NULL,
  telefono VARCHAR(50) NULL,
  direccion VARCHAR(255) NULL,
  PRIMARY KEY (IDProveedor),
  UNIQUE KEY uq_proveedor_cuit (cuit),
  UNIQUE KEY uq_proveedor_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Producto (
  IDProducto INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT NOT NULL,
  IDProveedor INT UNSIGNED NOT NULL,
  PRIMARY KEY (IDProducto),
  KEY idx_producto_proveedor (IDProveedor),
  CONSTRAINT fk_producto_proveedor
    FOREIGN KEY (IDProveedor) REFERENCES Proveedor (IDProveedor)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Pedido (
  IDPedido INT UNSIGNED NOT NULL AUTO_INCREMENT,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado VARCHAR(30) NOT NULL,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  IDUsuario INT UNSIGNED NOT NULL,
  PRIMARY KEY (IDPedido),
  KEY idx_pedido_usuario (IDUsuario),
  CONSTRAINT fk_pedido_usuario
    FOREIGN KEY (IDUsuario) REFERENCES Usuario (IDUsuario)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_pedido_total CHECK (total >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS PedidoInsumo (
  IDPedido INT UNSIGNED NOT NULL,
  PRIMARY KEY (IDPedido),
  CONSTRAINT fk_pedidoinsumo_pedido
    FOREIGN KEY (IDPedido) REFERENCES Pedido (IDPedido)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS PedidoImpresion (
  IDPedido INT UNSIGNED NOT NULL,
  cantCopias INT UNSIGNED NOT NULL,
  faz VARCHAR(30) NOT NULL,
  tamanio VARCHAR(50) NOT NULL,
  archivo VARCHAR(2048) NOT NULL,
  observacion TEXT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  PRIMARY KEY (IDPedido),
  CONSTRAINT fk_pedidoimpresion_pedido
    FOREIGN KEY (IDPedido) REFERENCES Pedido (IDPedido)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_impresion_copias CHECK (cantCopias > 0),
  CONSTRAINT chk_impresion_subtotal CHECK (subtotal >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ProdPed (
  IDPedido INT UNSIGNED NOT NULL,
  IDProducto INT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  PRIMARY KEY (IDPedido, IDProducto),
  KEY idx_prodped_producto (IDProducto),
  CONSTRAINT fk_prodped_pedidoinsumo
    FOREIGN KEY (IDPedido) REFERENCES PedidoInsumo (IDPedido)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_prodped_producto
    FOREIGN KEY (IDProducto) REFERENCES Producto (IDProducto)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_prodped_cantidad CHECK (cantidad > 0),
  CONSTRAINT chk_prodped_subtotal CHECK (subtotal >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Precio (
  IDProducto INT UNSIGNED NOT NULL,
  fechaDesde DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valor DECIMAL(12, 2) NOT NULL,
  PRIMARY KEY (IDProducto, fechaDesde),
  CONSTRAINT fk_precio_producto
    FOREIGN KEY (IDProducto) REFERENCES Producto (IDProducto)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_precio_valor CHECK (valor >= 0)
) ENGINE=InnoDB;
