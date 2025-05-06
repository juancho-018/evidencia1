let color= "rosado"
let estadoSemaforo = true

let mensajeSemaforo = color == "verde"? `seguir...`: color== "rojo"? `detengase`:
color== "amarillo"? `alistarse`: `dañado`

console.log(mensajeSemaforo)