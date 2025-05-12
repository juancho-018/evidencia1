let cola = []; 
const MAX_COLA = 7;


const agregarCliente = () => {
    if (cola.length >= MAX_COLA) {
        alert("La cola está llena. No se pueden agregar más clientes.");
        return;
    } else {
    let nombre = prompt("Ingresa el nombre del cliente:");
    while (!nombre || !isNaN(nombre)) {
        alert("Nombre inválido. Por favor, ingresa un nombre válido.");
        nombre = prompt("Ingresa el nombre del cliente:");
    }
        cola.push(nombre);
        alert(`Cliente "${nombre}" agregado a la cola.`);
}};
const atenderCliente = () => {
    if (cola.length === 0) {
        alert("No hay clientes en la cola.");
        return;
    }

    let atendido = cola.shift();
    alert(`Cliente atendido: ${atendido}`);
};

const mostrarCola = () => {
    let estado = "Clientes en cola:\n";
    if (cola.length === 0) {
        estado += "La cola está vacía.";
    } else {
        for (let i = 0; i < cola.length; i++) {
            estado += `${i + 1}. ${cola[i]}\n`;
        }
    }
    estado += `\nTotal: ${cola.length} / ${MAX_COLA}`;
    alert(estado);
};


while (true) {
    let opcion = prompt(
        `1. Agregar cliente\n2. Atender cliente\n3. Ver cola\n4. Salir\n\nClientes en cola: ${cola.length}/${MAX_COLA}\nElige una opción:`
    );

    if (opcion === "1") {
        agregarCliente();
    } else if (opcion === "2") {
        atenderCliente();
    } else if (opcion === "3") {
        mostrarCola();
    } else if (opcion === "4") {
        alert("Saliendo...");
        break;
    } else {
        alert("Opción inválida.");
    }
}
