let habitaciones = [0, 0, 0, 0, 0];

const mostrarEstado = () => {
    let estado = "Estado de habitaciones:\n";
    for (let i = 0; i < habitaciones.length; i++) {
        estado += `Habitación ${i + 1}: ${habitaciones[i] === 0 ? "Libre" : "Ocupada"}\n`;
    }
    estado += `\nTotal de habitaciones libres: ${disponibilidad()}`;
    alert(estado);
};

const disponibilidad = () => {
    let libres = 0;
    for (let i = 0; i < habitaciones.length; i++) {
        if (habitaciones[i] === 0) {
            libres++;
        }
    }
    return libres;
};

const esNumeroValido = (num) => num >= 1 && num <= 5;

const reservarHabitacion = (num) => {
    if (!esNumeroValido(num)) {
        alert("Número de habitación inválido. Usa 1-5.");
    } else if (habitaciones[num - 1] === 1) {
        alert("Habitación ya ocupada.");
    } else {
        habitaciones[num - 1] = 1;
        alert(`Habitación ${num} reservada con éxito.`);
        alert(`Habitaciones libres: ${disponibilidad()}`);
    }
};

const liberarHabitacion = (num) => {
    if (!esNumeroValido(num)) {
        alert("Número de habitación inválido. Usa 1-5.");
    } else if (habitaciones[num - 1] === 0) {
        alert("Habitación ya está libre.");
        alert(`Habitaciones libres: ${disponibilidad()}`);
    } else {
        habitaciones[num - 1] = 0;
        alert(`Habitación ${num} liberada con éxito.`);
        alert(`Habitaciones libres: ${disponibilidad()}`);
    }
};

while (true) {
    let opcion = prompt(
        `1. Ver estado\n2. Reservar\n3. Liberar\n4. Salir\n\nHabitaciones libres: ${disponibilidad()}\nElige una opción:`
    );

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
