class ClienteBanco {
  constructor(nombre, tipo, tieneCuenta) {
    this.nombre = nombre;
    this.tipo = tipo;
    this.tieneCuenta = tieneCuenta;
  }
}

class Banco {
  constructor() {
    this.cajas = [null, null, null, null, null];
    this.colas = {
      preferencial: [],
      general: [],
      sinCuenta: []
    };
  }

  agregarCliente(cliente) {
    if (cliente.tipo === "preferencial") this.colas.preferencial.push(cliente);
    else if (!cliente.tieneCuenta) this.colas.sinCuenta.push(cliente);
    else this.colas.general.push(cliente);
  }

  atenderClientes() {
    for (let i = 0; i < 5; i++) {
      if (i < 2) this.cajas[i] = this.obtenerCliente(); // retiros
      else if (i < 4) this.cajas[i] = this.obtenerCliente(); // depósitos
      else this.cajas[i] = this.obtenerCliente(); // asesoría
    }
    return this.cajas;
  }

  obtenerCliente() {
    return this.colas.preferencial.shift() || this.colas.general.shift() || this.colas.sinCuenta.shift() || null;
  }
}

// Prueba
let banco = new Banco();
banco.agregarCliente(new ClienteBanco("Ana", "preferencial", true));
banco.agregarCliente(new ClienteBanco("Carlos", "general", true));
banco.agregarCliente(new ClienteBanco("Marta", "general", false));

console.log(banco.atenderClientes());
