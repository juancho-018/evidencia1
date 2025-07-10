// Declaración de variables globales para controlar el estado del juego
let preguntas = [];              //preguntas cargadas del JSON
let preguntasRestantes = [];     
let timeLeft = 60;               
let timerId;                     
let currentQuestion = null;      
let puntos = 0;                  

const configDificultad = {
  'fácil':   { puntos: 50, bonus: 3, penal: 1 },
  'media':   { puntos: 100, bonus: 5, penal: 3 }, 
  'difícil': { puntos: 150, bonus: 10, penal: 4 } 
};

// Función asíncrona para cargar las preguntas desde un archivo JSON externo
async function cargarPreguntas() {
  try {
    const res = await fetch('preguntas.json');           // Carga el archivo 'preguntas.json'
    if (!res.ok) throw new Error('Error cargando preguntas'); // Lanza error si falla la carga
    preguntas = await res.json();                        // Convierte el JSON en objeto JS y lo guarda
    preguntasRestantes = [...preguntas];                 // Copia las preguntas al array restante
  } catch (e) {
    document.getElementById('status').textContent = 'Error cargando preguntas.'; // Mensaje de error en la interfaz
    console.error(e);                                    
  }
}

function normalizarRespuesta(texto) {
  return texto.toLowerCase()                                  // Convierte a minúsculas
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")         // Elimina tildes
    .replace(/[^a-z0-9 ]/g, "")                               // Elimina caracteres especiales
    .trim();                                                  // Elimina espacios al inicio y al final
}

// Genera una pregunta aleatoria del array de preguntas restantes
function generarPregunta() {
  if (preguntasRestantes.length === 0) throw new Error('No hay más preguntas.'); // Si no quedan preguntas, lanza error
  const i = Math.floor(Math.random() * preguntasRestantes.length);               // Índice aleatorio
  const pregunta = preguntasRestantes.splice(i, 1)[0];                           // Extrae y elimina la pregunta
  return {
    pregunta: pregunta.pregunta,                             // Texto de la pregunta
    respuesta: normalizarRespuesta(pregunta.respuesta),      // Respuesta normalizada
    dificultad: pregunta.dificultad || 'fácil'               // Dificultad (por defecto fácil)
  };
}

// Actualiza el contador visual del tiempo restante en la interfaz
function actualizarTemporizador() {
  document.getElementById('timer').textContent = timeLeft;                         // Muestra el tiempo
  document.getElementById('timer').style.color = timeLeft <= 10 ? '#ff4444' : '#4CAF50'; // Cambia color si el tiempo es crítico
}

// Actualiza la interfaz con la información de la pregunta actual
function actualizarInterfaz() {
  document.getElementById('question').textContent = currentQuestion.pregunta;            // Muestra pregunta
  document.getElementById('difficulty').textContent = currentQuestion.dificultad.toUpperCase(); // Muestra dificultad
  document.getElementById('points').textContent = puntos;                                 // Muestra puntaje

  // Actualiza el texto del botón de saltar según la penalización de la dificultad
  const penal = configDificultad[currentQuestion.dificultad].penal;
  document.getElementById('skipBtn').textContent = `Saltar Pregunta (-${penal}s)`;
}

// Inicia el juego al hacer clic en "Iniciar"
async function iniciarJuego() {
  // Referencias a elementos del DOM
  const startBtn = document.getElementById('startBtn');
  const submitBtn = document.getElementById('submitBtn');
  const skipBtn = document.getElementById('skipBtn');
  const answerInput = document.getElementById('answer');
  const statusEl = document.getElementById('status');

  // Activa y desactiva elementos según estado del juego
  startBtn.disabled = true;
  answerInput.disabled = false;
  submitBtn.disabled = false;
  skipBtn.disabled = false;

  puntos = 0;                                 // Reinicia puntos
  preguntasRestantes = [...preguntas];       // Reinicia preguntas

  try {
    currentQuestion = generarPregunta();      // Genera primera pregunta
    timeLeft = 60;                            // Reinicia temporizador
    actualizarInterfaz();                     // Muestra pregunta y datos
  } catch (e) {
    statusEl.textContent = e.message;         // Muestra mensaje de error
    return;
  }


  timerId = setInterval(() => {
    timeLeft--;                               // Resta un segundo
    actualizarTemporizador();                 // Actualiza la vista
    if (timeLeft <= 0) {                      
      finalizarJuego(false);                  
      statusEl.textContent = '¡Tiempo agotado!';
    }
  }, 1000);

  // Asigna funciones a botones
  submitBtn.onclick = manejarRespuesta;
  skipBtn.onclick = manejarSalto;
}

// Función que maneja cuando el usuario envía una respuesta
function manejarRespuesta() {
  const input = document.getElementById('answer');
  const statusEl = document.getElementById('status');
  const usuario = normalizarRespuesta(input.value);                   // Normaliza entrada del usuario
  const config = configDificultad[currentQuestion.dificultad];        // Config según dificultad actual

  if (usuario === currentQuestion.respuesta) {
    puntos += config.puntos;      // Suma puntos
    timeLeft += config.bonus;     // Añade tiempo extra
    statusEl.textContent = `✓ Correcto! +${config.puntos}p, +${config.bonus}s`;  // Mensaje positivo

    try {
      currentQuestion = generarPregunta();  // Nueva pregunta
      actualizarInterfaz();
    } catch (e) {
      finalizarJuego(true);  // Si ya no hay más preguntas, se gana
      statusEl.textContent = '¡Ganaste! Completaste todas las preguntas.';
    }

  } else {
    statusEl.textContent = '✗ Incorrecto, intenta de nuevo.';  // Mensaje de error
  }

  input.value = '';                    // Limpia el campo de texto
  actualizarTemporizador();           // Refresca cronómetro
}

// Función que maneja cuando el usuario salta una pregunta
function manejarSalto() {
  const config = configDificultad[currentQuestion.dificultad];
  const penal = config.penal;
  const statusEl = document.getElementById('status');

  if (timeLeft > penal) {             // Solo permite saltar si hay suficiente tiempo
    timeLeft -= penal;                // Aplica penalización de tiempo

    try {
      currentQuestion = generarPregunta(); // Nueva pregunta
      actualizarInterfaz();
      statusEl.textContent = `Pregunta saltada (-${penal}s)`; // Mensaje de salto
    } catch (e) {
      finalizarJuego(true); // Ganaste si no quedan más preguntas
      statusEl.textContent = '¡Ganaste! Completaste todas las preguntas.';
    }

    actualizarTemporizador();
  } else {
    statusEl.textContent = 'No hay suficiente tiempo para saltar.'; // Si no se puede saltar
  }
}

// Termina el juego, ganes o pierdas
function finalizarJuego(ganaste) {
  clearInterval(timerId);             // Detiene el temporizador
  document.getElementById('startBtn').disabled = false;
  document.getElementById('answer').disabled = true;
  document.getElementById('submitBtn').disabled = true;
  document.getElementById('skipBtn').disabled = true;

  const statusEl = document.getElementById('status');
  if (!ganaste)
    statusEl.textContent = `¡Juego terminado! Puntos: ${puntos}`; // Muestra puntaje final
}

// Asocia el botón "Iniciar" con la función iniciarJuego
document.getElementById('startBtn').addEventListener('click', iniciarJuego);

// Permite enviar la respuesta presionando la tecla Enter
document.getElementById('answer').addEventListener('keypress', e => {
  if (e.key === 'Enter') document.getElementById('submitBtn').click();
});

// Carga las preguntas cuando se carga la página
cargarPreguntas();
