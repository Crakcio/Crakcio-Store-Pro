const bgCanvas = document.getElementById('backgroundStars');
const bgCtx = bgCanvas.getContext('2d');

let stars = [];
const numStars = 100;

function resizeCanvas() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

for (let i = 0; i < numStars; i++) {
  stars.push({
    x: Math.random() * bgCanvas.width,
    y: Math.random() * bgCanvas.height,
    radius: Math.random() * 2,
    speed: Math.random() * 0.5 + 0.2
  });
}

function animateStars() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  bgCtx.fillStyle = '#000';
  bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

  bgCtx.fillStyle = 'white';
  stars.forEach(star => {
    star.y += star.speed;
    if (star.y > bgCanvas.height) {
      star.y = 0;
      star.x = Math.random() * bgCanvas.width;
    }
    bgCtx.beginPath();
    bgCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    bgCtx.fill();
  });

  requestAnimationFrame(animateStars);
}

animateStars();
