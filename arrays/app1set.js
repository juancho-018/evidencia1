// Set para llevar un registro de las habitaciones ocupadas
let habitacionesOcupadas = new Set();

// Función para mostrar estado de habitaciones
const mostrarEstado = () => {
  let estado = "Estado de habitaciones:\n";
  for (let i = 1; i <= 5; i++) {
    estado += `Habitación ${i}: ${habitacionesOcupadas.has(i) ? "Ocupada" : "Libre"}\n`;
  }
  alert(estado);
};

// Función para reservar una habitación
const reservarHabitacion = (num) => {
  if (num < 1 || num > 5) {
    alert("Número de habitación inválido. Usa 1-5.");
  } else if (habitacionesOcupadas.has(num)) {
    alert("Habitación ya ocupada.");
  } else {
    habitacionesOcupadas.add(num);
    alert(`Habitación ${num} reservada con éxito.`);
  }
};

// Función para liberar una habitación
const liberarHabitacion = (num) => {
  if (num < 1 || num > 5) {
    alert("Número de habitación inválido. Usa 1-5.");
  } else if (!habitacionesOcupadas.has(num)) {
    alert("Habitación ya está libre.");
  } else {
    habitacionesOcupadas.delete(num);
    alert(`Habitación ${num} liberada con éxito.`);
  }
};

// Menú principal
while (true) {
  let opcion = prompt("1. Ver estado\n2. Reservar\n3. Liberar\n4. Salir\nElige una opción:");
  
  if (opcion === "1") {
    mostrarEstado();
  } else if (opcion === "2") {
    let num = parseInt(prompt("Ingresa el número de habitación (1-5):"));
    reservarHabitacion(num);
  } else if (opcion === "3") {
    let num = parseInt(prompt("Ingresa el número de habitación (1-5):"));
    liberarHabitacion(num);
  } else if (opcion === "4") {
    alert("Saliendo...");
    break;
  } else {
    alert("Opción inválida.");
  }
}
