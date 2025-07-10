// Clase base para productos
class Producto {
    constructor(codigo, descripcion, precioCompra, precioVenta, cantidadBodega, cantidadMinima, cantidadMaxima, porcentajeDescuento) {
        this.codigo = codigo;
        this.descripcion = descripcion;
        this.precioCompra = precioCompra;
        this.precioVenta = precioVenta;
        this.cantidadBodega = cantidadBodega;
        this.cantidadMinima = cantidadMinima;
        this.cantidadMaxima = cantidadMaxima;
        this.porcentajeDescuento = porcentajeDescuento;
    }

    solicitarPedido() {
        return this.cantidadBodega < this.cantidadMinima;
    }

    calcularTotalAPagar(cantidad) {
        return cantidad * this.precioCompra;
    }
}

// Subclase para prendas de vestir
class Prenda extends Producto {
    constructor(codigo, descripcion, precioCompra, precioVenta, cantidadBodega, cantidadMinima, cantidadMaxima, porcentajeDescuento, talla, permitePlanchado) {
        super(codigo, descripcion, precioCompra, precioVenta, cantidadBodega, cantidadMinima, cantidadMaxima, porcentajeDescuento);
        this.talla = talla;
        this.permitePlanchado = permitePlanchado;
    }
}

// Subclase para calzado
class Calzado extends Producto {
    constructor(codigo, descripcion, precioCompra, precioVenta, cantidadBodega, cantidadMinima, cantidadMaxima, porcentajeDescuento, talla) {
        super(codigo, descripcion, precioCompra, precioVenta, cantidadBodega, cantidadMinima, cantidadMaxima, porcentajeDescuento);
        this.talla = talla;
    }
}

// Ejemplo de uso
let prenda1 = new Prenda('P001', 'Blusa de algodón', 15000, 35000, 20, 5, 50, 10, 'M', true);
let calzado1 = new Calzado('C001', 'Tenis deportivos', 25000, 55000, 15, 3, 30, 5, 38);

// Estructura de datos para guardar productos
let prendas = [prenda1];
let calzados = [calzado1];

// Consulta de cantidad de productos
console.log("Cantidad de prendas de vestir a manejar:", prendas.length);
console.log("Cantidad de productos de calzado a manejar:", calzados.length);
