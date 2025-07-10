class Cliente {
  constructor(id, pin, cuentas) {
    this.id = id;
    this.pin = pin;
    this.cuentas = cuentas; // objeto {cuenta1: saldo, cuenta2: saldo}
  }

  validarPin(inputPin) {
    return this.pin === inputPin;
  }

  retirar(cuenta, monto) {
    if (monto % 50000 !== 0) return "Monto debe ser múltiplo de 50000";
    if (this.cuentas[cuenta] >= monto) {
      this.cuentas[cuenta] -= monto;
      return `Retiro exitoso, puede tomar $${monto}`;
    }
    return "Fondos insuficientes";
  }

  depositar(cuenta, monto) {
    this.cuentas[cuenta] += monto;
    return `Depósito exitoso. Nuevo saldo: $${this.cuentas[cuenta]}`;
  }

  transferir(origen, destino, monto) {
    if (this.cuentas[origen] >= monto) {
      this.cuentas[origen] -= monto;
      this.cuentas[destino] += monto;
      return `Transferencia exitosa de $${monto}`;
    }
    return "Fondos insuficientes";
  }

  consultarSaldo(cuenta) {
    return `Saldo de ${cuenta}: $${this.cuentas[cuenta]}`;
  }
}

// Simulación
const cliente = new Cliente("123", "4567", { ahorros: 300000, corriente: 200000 });

let intentos = 0;
let pinCorrecto = false;
while (intentos < 3 && !pinCorrecto) {
  let pin = prompt("Ingrese su PIN:");
  if (cliente.validarPin(pin)) {
    pinCorrecto = true;
    alert("Acceso autorizado");
  } else {
    intentos++;
    alert("PIN incorrecto");
  }
}

if (!pinCorrecto) {
  alert("Demasiados intentos. Saliendo...");
} else {
  let opcion;
  do {
    opcion = prompt("1. Retiro\n2. Depósito\n3. Transferencia\n4. Saldo\n5. Salir");
    switch (opcion) {
      case "1":
        alert(cliente.retirar("ahorros", parseInt(prompt("Monto a retirar:"))));
        break;
      case "2":
        alert(cliente.depositar("ahorros", parseInt(prompt("Monto a depositar:"))));
        break;
      case "3":
        alert(cliente.transferir("ahorros", "corriente", parseInt(prompt("Monto a transferir:"))));
        break;
      case "4":
        alert(cliente.consultarSaldo("ahorros"));
        break;
    }
  } while (opcion !== "5");
}
