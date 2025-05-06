const calculo = num => {
    if (num < 0) {
        return "El numero debe ser positivo.";
    }

    else if (num === 0) {
        return 1;
    }

    else {
        let calculo = 1;
        for (let i = 1; i <= num; i++) {
            calculo *= i;
        }
        return calculo;
    }
}

console.log(calculo(8));