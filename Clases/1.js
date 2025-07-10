class Usuario {
  constructor(nombre, tipo) {
    this.nombre = nombre;
    this.tipo = tipo; // 'Estudiante' o 'Docente'
  }
}

class ModuloAtencion {
  constructor(nombre) {
    this.nombre = nombre;
    this.usuariosAtendidos = [];
  }

  atender(usuario) {
    this.usuariosAtendidos.push({ usuario, fecha: new Date() });
  }

  transferir(usuario, otroModulo) {
    this.usuariosAtendidos = this.usuariosAtendidos.filter(u => u.usuario !== usuario);
    otroModulo.atender(usuario);
    return { usuario, de: this.nombre, a: otroModulo.nombre, fecha: new Date() };
  }

  estadisticas() {
    const stats = { total: this.usuariosAtendidos.length, Estudiante: 0, Docente: 0 };
    for (const atencion of this.usuariosAtendidos) {
      stats[atencion.usuario.tipo]++;
    }
    return stats;
  }
}

// Prueba
const terminal = new ModuloAtencion("Terminal");
const oficina = new ModuloAtencion("Oficina");
const transferencias = [];

const u1 = new Usuario("Ana", "Estudiante");
const u2 = new Usuario("Luis", "Docente");

terminal.atender(u1);
terminal.atender(u2);
transferencias.push(terminal.transferir(u2, oficina));

console.log("Terminal:", terminal.estadisticas());
console.log("Oficina:", oficina.estadisticas());
console.log("Transferencias:", transferencias);

