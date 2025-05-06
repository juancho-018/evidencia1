// Saldo inicial
let saldo = 1000;

// Arreglo para registrar las últimas 5 transacciones
let transacciones = [];

// Mostrar el estado actual del saldo
function consultarSaldo() {
  alert(`Tu saldo actual es: $${saldo}`);
}

  function verHistorial() {
    let historial = "Últimas transacciones:\n";
    if (transacciones.length === 0) {
      historial += "No hay transacciones registradas.";
    } else {
      transacciones.forEach((t, i) => {
        let tipo = t > 0 ? "Depósito" : "Retiro";
        historial += `${tipo}: $${t}\n`;
      });
    }
    alert(historial);
  }

// Depositar dinero
function depositar() {
  let monto = parseFloat(prompt("Ingresa el monto que deseas   depositar:"));
  if (isNaN(monto) || monto <= 0) {
    alert("Monto inválido.");
    return;
  }
  saldo += monto;
  registrarTransaccion(monto);
  alert(`Depósito exitoso. Nuevo saldo: $${saldo}`);
}

// Retirar dinero
function retirar() {
  let monto = parseFloat(prompt("Ingresa el monto que deseas retirar (máx $500):"));
  if (isNaN(monto) || monto <= 0) {
    alert("Monto inválido.");
    return;
  }
  if (monto > 500) {
    alert("No puedes retirar más de $500 en una sola transacción.");
    return;
  }
  if (monto > saldo) {
    alert("Fondos insuficientes.");
    return;
  }
  saldo -= monto;
  registrarTransaccion(-monto);
  alert(`Retiro exitoso. Nuevo saldo: $${saldo}`);
}

// Registrar una transacción y mantener solo las últimas 5
function registrarTransaccion(monto) {
  transacciones.push(monto);
  if (transacciones.length > 5) {
    transacciones.shift(); // Elimina la más antigua
  }
}

// Menú principal
function menu() {
  let opcion;
  do {
    opcion = prompt(
      "Bienvenido al Cajero Automático\n\n" +
      "¿Qué quieres hacer?\n" +
      "1. Consultar saldo\n" +
      "2. Depositar dinero\n" +
      "3. Retirar dinero\n" +
      "4. Ver historial de transacciones\n" +
      "5. Salir\n\n"
    
    );

    switch (opcion) {
      case "1":
        consultarSaldo();
        break;
      case "2":
        depositar();
        break;
      case "3":
        retirar();
        break;
      case "4":
        verHistorial();
        break;
      case "5":
        alert("Gracias por usar el cajero. ¡Hasta luego!");
        break;
      default:
        alert("Opción no válida. Intenta de nuevo.");
    }
  } while (opcion !== "5");
}

// Ejecutar el menú
menu();
