// Inicializamos las habitaciones del hotel (5 habitaciones, todas libres)
let habitaciones = [0, 0, 0, 0, 0];

// Función para mostrar el estado de todas las habitaciones
function mostrarEstadoHabitaciones() {
    let estado = "Estado de las habitaciones:\n";
    for (let i = 0; i < habitaciones.length; i++) {
        estado += `Habitación ${i + 1}: ${habitaciones[i] === 0 ? 'Libre 🟢' : 'Ocupada 🔴'}\n`;
    }
    alert(estado);
}

// Función para reservar una habitación
function reservarHabitacionEspecifica() {
    let habitacionElegida;
    while (true) {
        let disponible = "Habitaciones disponibles: \n";
        let habitacionesDisponibles = false;
        
        for (let i = 0; i < habitaciones.length; i++) {
            if (habitaciones[i] === 0) {
                disponible += `${i + 1}. Habitación ${i + 1} (Libre 🟢)\n`;
                habitacionesDisponibles = true;
            }
        }

        if (!habitacionesDisponibles) {
            alert("No hay habitaciones disponibles en este momento 🛑.");
            break;
        }

        habitacionElegida = parseInt(prompt(disponible + "Ingrese el número de la habitación que desea reservar (1-5):")) - 1;
        
        if (habitacionElegida >= 0 && habitacionElegida < habitaciones.length) {
            if (habitaciones[habitacionElegida] === 0) {
                habitaciones[habitacionElegida] = 1;
                alert(`Habitación ${habitacionElegida + 1} reservada 🏨.`);
                break;
            } else {
                // Si la habitación está ocupada, ofrecer liberar y reservar en el mismo prompt
                let opcion = prompt(`La habitación ${habitacionElegida + 1} está ocupada 🔴. \n\n¿Qué desea hacer?\n1. Liberar y reservar esta habitación\n2. Intentar con otra habitación`);
                
                if (opcion === '1') {
                    habitaciones[habitacionElegida] = 0;  // Liberamos la habitación
                    habitaciones[habitacionElegida] = 1;  // La reservamos nuevamente
                    alert(`Habitación ${habitacionElegida + 1} liberada y reservada 🏨.`);
                    break;
                } else if (opcion === '2') {
                    alert(`La habitación ${habitacionElegida + 1} sigue ocupada 🔴. Intente con otra habitación.`);
                } else {
                    alert("Opción inválida, intente nuevamente.");
                }
            }
        } else {
            alert("Número de habitación inválido. Intente nuevamente 🚫.");
        }
    }
    mostrarEstadoHabitaciones();
}

// Función para liberar una habitación
function liberarHabitacion() {
    let habitacionALiberar;
    let habitacionesOcupadas = false;
    
    // Mostramos las habitaciones ocupadas
    let ocupada = "Habitaciones ocupadas: \n";
    for (let i = 0; i < habitaciones.length; i++) {
        if (habitaciones[i] === 1) {
            ocupada += `${i + 1}. Habitación ${i + 1} (Ocupada 🔴)\n`;
            habitacionesOcupadas = true;
        }
    }

    // Si no hay habitaciones ocupadas, mostramos el mensaje
    if (!habitacionesOcupadas) {
        alert("Todas las habitaciones están libres 🟢.");
        return;  // Salimos de la función si no hay habitaciones ocupadas
    }

    // Mostramos las habitaciones ocupadas y preguntamos al usuario cuál desea liberar
    habitacionALiberar = parseInt(prompt(ocupada + "Ingrese el número de la habitación que desea liberar (1-5): ")) - 1;

    if (habitacionALiberar >= 0 && habitacionALiberar < habitaciones.length) {
        if (habitaciones[habitacionALiberar] === 1) {  // Si la habitación está ocupada
            let liberar = confirm(`¿Desea liberar la habitación ${habitacionALiberar + 1} que está ocupada 🔴?`);
            if (liberar) {
                habitaciones[habitacionALiberar] = 0;  // Liberamos la habitación
                alert(`Habitación ${habitacionALiberar + 1} liberada 🟢.`);
            } else {
                alert(`La habitación ${habitacionALiberar + 1} no ha sido liberada.`);
            }
        } else {
            alert(`La habitación ${habitacionALiberar + 1} ya está libre 🟢.`);
        }
    } else {
        alert("Número de habitación inválido. Intente nuevamente 🚫.");
    }

    mostrarEstadoHabitaciones();
}


// Función para mostrar el menú
function menu() {
    let opcion;
    do {
        opcion = parseInt(prompt(`
Bienvenido al Hotel Las Delicias  🏨 \n
Opciones: 
1. Reservar una habitación (elige una específica)
2. Liberar una habitación
3. Ver estado de las habitaciones
4. Salir
Seleccione una opción:`));

        switch(opcion) {
            case 1:
                reservarHabitacionEspecifica();
                break;
            case 2:
                liberarHabitacion();
                break;
            case 3:
                mostrarEstadoHabitaciones();
                break;
            case 4:
                alert("Gracias por usar el sistema de reservas.");
                break;
            default:
                alert("Opción inválida, intente nuevamente.");
        }
    } while (opcion !== 4);
}

// Ejecutamos el menú
menu();
