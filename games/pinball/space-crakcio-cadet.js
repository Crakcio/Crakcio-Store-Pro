import { supabase } from '../../supabaseClient.js';
import { guardarPuntaje } from '../ranking-crakcio.js';

const canvas = document.getElementById('pinballCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 800;

let score = 0;
let lives = 3;
let gameOver = false;

const ball = {
  x: 300,
  y: 100,
  radius: 10,
  vx: 2,
  vy: 2
};

const flippers = {
  left: { x: 200, y: 700, width: 80, height: 20, angle: 0 },
  right: { x: 320, y: 700, width: 80, height: 20, angle: 0 }
};

const bumpers = [
  { x: 250, y: 150, radius: 20 },
  { x: 350, y: 150, radius: 20 },
  { x: 300, y: 220, radius: 20 }
];

let leftFlipperActive = false;
let rightFlipperActive = false;

const sonidos = {
  SOUND1: new Audio('../sounds/SOUND1.WAV'),
  SOUND3: new Audio('../sounds/SOUND3.WAV'),
  SOUND4: new Audio('../sounds/SOUND4.WAV'),
  SOUND5: new Audio('../sounds/SOUND5.WAV')
};

function reproducirSonido(nombre) {
  const sonido = sonidos[nombre];
  if (sonido) {
    sonido.currentTime = 0;
    sonido.play();
  }
}

function detectarColisionFlipper(flipper) {
  const dx = ball.x - (flipper.x + flipper.width / 2);
  const dy = ball.y - (flipper.y + flipper.height / 2);
  const distancia = Math.sqrt(dx * dx + dy * dy);
  return (
    distancia < ball.radius + Math.max(flipper.width, flipper.height) / 2 &&
    ball.y + ball.radius > flipper.y
  );
}

function aplicarReboteFlipper(flipper, direccion) {
  ball.vy = -Math.abs(ball.vy);
  ball.vx += direccion * 2;
  reproducirSonido('SOUND1');
  score += 50;
}

function detectarBumper(bumper) {
  const dx = ball.x - bumper.x;
  const dy = ball.y - bumper.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < bumper.radius + ball.radius;
}

function rebotarBumper(bumper) {
  const angle = Math.atan2(ball.y - bumper.y, ball.x - bumper.x);
  ball.vx = Math.cos(angle) * 5 + (Math.random() - 0.5);
  ball.vy = Math.sin(angle) * 5 + (Math.random() - 0.5);
  score += 100;
  reproducirSonido('SOUND4');
}

function reiniciarBola() {
  lives--;
  if (lives <= 0) {
    finDelJuego();
    return;
  }
  ball.x = 300;
  ball.y = 100;
  ball.vx = (Math.random() - 0.5) * 2;
  ball.vy = 2;
  reproducirSonido('SOUND5');
}

function finDelJuego() {
  gameOver = true;
  reproducirSonido('SOUND3');
  alert(`🎮 Juego terminado\nTu puntaje: ${score}`);
  guardarPuntajeFinal(score);
}

async function guardarPuntajeFinal(puntajeFinal) {
  const usuario = await supabase.auth.getUser();
  if (usuario?.data?.user) {
    const userId = usuario.data.user.id;
    guardarPuntaje(userId, 'space-crakcio-cadet', puntajeFinal);
  }
}

function dibujarBumpers() {
  bumpers.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'purple';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.stroke();
  });
}

function dibujarFlippers() {
  ctx.fillStyle = 'red';
  ctx.fillRect(flippers.left.x, flippers.left.y, flippers.left.width, flippers.left.height);
  ctx.fillRect(flippers.right.x, flippers.right.y, flippers.right.width, flippers.right.height);
}

function dibujarHUD() {
  ctx.fillStyle = 'white';
  ctx.font = '20px Orbitron';
  ctx.fillText(`Puntaje: ${score}`, 20, 40);
  ctx.fillText(`Bolas: ${lives}`, 20, 70);

  ctx.fillStyle = 'cyan';
  const estado = musicaDesafio.paused ? 'Normal' : 'Desafío';
  ctx.fillText(`Modo: ${estado}`, canvas.width - 150, 40);
}


function moverFlippers() {
  if (leftFlipperActive) flippers.left.angle = -0.5;
  else flippers.left.angle = 0;

  if (rightFlipperActive) flippers.right.angle = 0.5;
  else flippers.right.angle = 0;
}

function actualizar() {
  if (gameOver) return;

  moverFlippers();

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) {
    ball.vx *= -1;
  }

  if (ball.y < ball.radius) {
    ball.vy *= -1;
  }

  if (ball.y > canvas.height - ball.radius) {
    reiniciarBola();
  }

  if (leftFlipperActive && detectarColisionFlipper(flippers.left)) {
    aplicarReboteFlipper(flippers.left, -1);
  }

  if (rightFlipperActive && detectarColisionFlipper(flippers.right)) {
    aplicarReboteFlipper(flippers.right, 1);
  }

  bumpers.forEach(bumper => {
    if (detectarBumper(bumper)) {
      rebotarBumper(bumper);
    }
  });
}

function loop() {
  actualizar();
  dibujar();
  requestAnimationFrame(loop);
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') leftFlipperActive = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') rightFlipperActive = true;
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') leftFlipperActive = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') rightFlipperActive = false;
});



// 🎵 Música de fondo y música especial (MID)
const musicaFondo = new Audio('sounds/PINBALL.MID');
musicaFondo.loop = true;
musicaFondo.volume = 0.4;

const musicaDesafio = new Audio('sounds/PINBALL2.MID');
musicaDesafio.loop = true;
musicaDesafio.volume = 0.4;

musicaFondo.play().catch(() => {
  console.warn('Autoplay bloqueado, se iniciará con clic.');
});

canvas.addEventListener('click', () => {
  if (musicaFondo.paused && !gameOver) {
    musicaFondo.play();
  }
});

function activarModoDesafio() {
  musicaFondo.pause();
  musicaDesafio.currentTime = 0;
  musicaDesafio.play();
  alert('🚨 Modo Desafío Activado!');
}

function desactivarModoDesafio() {
  musicaDesafio.pause();
  musicaFondo.play();
}
// Detectar colisiones con bordes inclinados u obstáculos personalizados
// Próximamente se agregarán sensores y zonas especiales

// Dificultad dinámica (ajusta velocidad y rebotes según puntaje)
function ajustarDificultad() {
  if (score >= 500) {
    ball.vx *= 1.05;
    ball.vy *= 1.05;
  }
  if (score >= 1000) {
    activarModoDesafio();
  }
}

// Activar rebote visual con efecto neón (opcional)
function efectoReboteNeon(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.strokeStyle = 'aqua';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 1;
}

// Pulsadores de efecto (simulación)
const pulsadores = [
  { x: 280, y: 500, width: 40, height: 10 },
  { x: 320, y: 550, width: 40, height: 10 }
];

function dibujarPulsadores() {
  pulsadores.forEach(p => {
    ctx.fillStyle = 'lime';
    ctx.fillRect(p.x, p.y, p.width, p.height);
  });
}

function detectarColisionPulsador(pulsador) {
  return (
    ball.x > pulsador.x &&
    ball.x < pulsador.x + pulsador.width &&
    ball.y + ball.radius > pulsador.y &&
    ball.y - ball.radius < pulsador.y + pulsador.height
  );
}

function activarPulsador(pulsador) {
  ball.vy *= -1.2;
  score += 75;
  efectoReboteNeon(pulsador.x + pulsador.width / 2, pulsador.y);
  reproducirSonido('SOUND14');
}

// Zonas de bonificación (ejemplo con coordenadas)
const zonasBonus = [
  { x: 100, y: 300, width: 30, height: 30, activa: true },
  { x: 460, y: 300, width: 30, height: 30, activa: true }
];

function dibujarZonasBonus() {
  zonasBonus.forEach(z => {
    if (z.activa) {
      ctx.strokeStyle = 'gold';
      ctx.strokeRect(z.x, z.y, z.width, z.height);
    }
  });
}

function detectarZonaBonus(zona) {
  return (
    zona.activa &&
    ball.x > zona.x &&
    ball.x < zona.x + zona.width &&
    ball.y > zona.y &&
    ball.y < zona.y + zona.height
  );
}

function activarZonaBonus(zona) {
  zona.activa = false;
  score += 200;
  reproducirSonido('SOUND17');
  efectoReboteNeon(zona.x + zona.width / 2, zona.y + zona.height / 2);
}

// Incorporar estas detecciones al ciclo de actualización
const originalActualizar = actualizar;
actualizar = function () {
  originalActualizar();

  // Revisar pulsadores
  pulsadores.forEach(p => {
    if (detectarColisionPulsador(p)) {
      activarPulsador(p);
    }
  });

  // Revisar zonas bonus
  zonasBonus.forEach(z => {
    if (detectarZonaBonus(z)) {
      activarZonaBonus(z);
    }
  });

  ajustarDificultad();
};
// Efectos visuales: rastro de luz
function dibujarRastro() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius + 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
  ctx.fill();
}

// Bonus especial o zona secreta (puedes personalizar esto luego)
const zonasEspeciales = [
  { x: 100, y: 400, width: 80, height: 20, activado: false }
];

function verificarZonaEspecial() {
  zonasEspeciales.forEach(z => {
    if (
      ball.x > z.x &&
      ball.x < z.x + z.width &&
      ball.y > z.y &&
      ball.y < z.y + z.height &&
      !z.activado
    ) {
      score += 300;
      z.activado = true;
      reproducirSonido('SOUND9'); // Efecto único
      activarModoDesafio();
      setTimeout(desactivarModoDesafio, 10000); // Regresar a modo normal
    }
  });
}

function dibujarZonasEspeciales() {
  zonasEspeciales.forEach(z => {
    ctx.fillStyle = z.activado ? 'green' : 'yellow';
    ctx.fillRect(z.x, z.y, z.width, z.height);
  });
}

// Sobrescribir la función dibujar para incluir nuevas capas
function dibujar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fondo estrellado
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  dibujarEstrellas();

  // Bola y rastro
  dibujarRastro();
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();

  // Elementos del juego
  dibujarFlippers();
  dibujarBumpers();
  dibujarPulsadores();
  dibujarZonasBonus();
  dibujarZonasEspeciales();
  dibujarHUD();
}


// Efecto visual del fondo: estrellas animadas
const estrellas = [];
for (let i = 0; i < 100; i++) {
  estrellas.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 2,
    alpha: Math.random()
  });
}

function dibujarEstrellas() {
  estrellas.forEach(estrella => {
    ctx.beginPath();
    ctx.arc(estrella.x, estrella.y, estrella.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${estrella.alpha})`;
    ctx.fill();
    estrella.alpha += (Math.random() - 0.5) * 0.05;
    if (estrella.alpha < 0) estrella.alpha = 0;
    if (estrella.alpha > 1) estrella.alpha = 1;
  });
}
// Configurar botones para activar/desactivar música o efectos especiales (opcional)
// Puedes agregar esto en el HTML para control manual
// document.getElementById('btnDesafio').addEventListener('click', activarModoDesafio);
// document.getElementById('btnNormal').addEventListener('click', desactivarModoDesafio);

// Agregar eventos táctiles para móviles
canvas.addEventListener('touchstart', (e) => {
  const touchX = e.touches[0].clientX;
  if (touchX < canvas.width / 2) {
    leftFlipperActive = true;
  } else {
    rightFlipperActive = true;
  }
});

canvas.addEventListener('touchend', () => {
  leftFlipperActive = false;
  rightFlipperActive = false;
});

// Preparar todo para reiniciar si el usuario lo desea
function reiniciarJuego() {
  score = 0;
  lives = 3;
  gameOver = false;
  ball.x = 300;
  ball.y = 100;
  ball.vx = 2;
  ball.vy = 2;

  zonasEspeciales.forEach(z => z.activado = false);
  musicaFondo.currentTime = 0;
  musicaFondo.play();
  loop();
}
loop();
// Botón de reinicio si quieres mostrarlo luego
// document.getElementById('btnReiniciar').addEventListener('click', reiniciarJuego);

// Mostrar instrucciones breves en consola para el jugador
console.log(`
🎮 Controles:
- A o ←: Flipper Izquierdo
- D o →: Flipper Derecho
- Click en el canvas: Activar música
- Tocando lado izquierdo o derecho (móvil): Controlar flippers
`);

