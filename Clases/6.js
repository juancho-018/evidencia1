class ProductoSubasta {
  constructor(id, nombre, fecha, precioInicial) {
    this.id = id;
    this.nombre = nombre;
    this.fecha = fecha;
    this.precioInicial = precioInicial;
    this.ofertas = [];
  }

  agregarOferta(comprador, fecha, valor) {
    this.ofertas.push({ comprador, fecha, valor });
  }

  obtenerOfertas() {
    return this.ofertas;
  }

  mejorOferta() {
    return this.ofertas.reduce((max, o) => o.valor > max.valor ? o : max, { valor: 0 });
  }
}

// Prueba
let producto1 = new ProductoSubasta(1, "Pintura", "2025-05-18", 100000);
producto1.agregarOferta("Juan", "2025-05-18", 120000);
producto1.agregarOferta("Maria", "2025-05-18", 150000);

console.log("Producto:", producto1.nombre);
console.log("Ofertas:", producto1.obtenerOfertas());
console.log("Oferta ganadora:", producto1.mejorOferta());
