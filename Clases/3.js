class Habitacion {
  constructor(tipo, fumador, capacidad) {
    this.tipo = tipo;
    this.fumador = fumador;
    this.capacidad = capacidad;
    this.reservada = false;
  }
}

class Hotel {
  constructor() {
    this.habitaciones = [];
    this.reservas = [];

    const tipos = [
      { tipo: "Individual", capacidad: 2 },
      { tipo: "Doble", capacidad: 4 },
      { tipo: "Familiar", capacidad: 6 }
    ];

    for (let t of tipos) {
      for (let i = 0; i < 3; i++) {
        this.habitaciones.push(new Habitacion(t.tipo, false, t.capacidad));
        this.habitaciones.push(new Habitacion(t.tipo, true, t.capacidad));
      }
    }
  }

  reservar(nombre, pais, tipo, personas, mascota, fumador, dias) {
    if (tipo === "Familiar" || !mascota) {
      let disponible = this.habitaciones.find(h =>
        h.tipo === tipo &&
        h.fumador === fumador &&
        !h.reservada &&
        personas <= h.capacidad
      );

      if (disponible) {
        disponible.reservada = true;
        this.reservas.push({ nombre, pais, personas, dias, mascota });
        return "Reserva exitosa";
      }
    }
    return "No se pudo hacer la reserva";
  }

  estadisticas() {
    const ocupacion = this.reservas.reduce((acc, r) => acc + r.personas, 0);
    return { totalReservas: this.reservas.length, personasOcupando: ocupacion };
  }
}

// Ejemplo
const hotel = new Hotel();
console.log(hotel.reservar("Pedro", "Colombia", "Familiar", 5, true, false, 3));
console.log(hotel.reservar("Laura", "México", "Individual", 2, false, true, 2));
console.log(hotel.estadisticas());
