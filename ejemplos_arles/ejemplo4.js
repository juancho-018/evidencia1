const fibonacci = (n) => {
    if (n <= 0 || !Number.isInteger(n)) {
        return "Por favor, ingrese un número entero positivo.";
    }

    let resultado = [];
    let a = 0, b = 1;

    resultado.push(a, b);

    for (let i = 2; i < n; i++) {
        const siguiente = a + b;
        resultado.push(siguiente);
        a = b;
        b = siguiente;
    }

    return resultado;
}

console.log(fibonacci(8));  
