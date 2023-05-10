/**
 * Random Int from Range Inclusive
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Three optional function to get different colors
function randomColor(colors) {
  return colors[Math.floor(Math.random() * colors.length)];
}

/* Cool */
function getColor() {
  return "#" + Math.floor(Math.random() * 16777215).toString(16);
}

function niceColor() {
  const r = randInt(0, 360);
  return `hsl(${r}deg 100% 50%)`;
}

// Pythagorean theorem
function distance(x1, y1, x2, y2) {
  let xDistance = x2 - x1;
  let yDistance = y2 - y1;
  return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

class Particle {
  constructor(x, y, radius, color, xSpeed, ySpeed, wallCollision = true) {
    this.x = x;
    this.y = y;
    this.xSpeed = xSpeed;
    this.ySpeed = ySpeed;
    this.velocity = {
      x: this.xSpeed,
      y: this.ySpeed,
    };
    this.radius = radius;
    this.color = color;
    this.mass = 1; // Used in elastic collision
    this.opacity = 0.2;
    this.wallCollision = wallCollision;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.lineWidth = 2;
    ctx.fillStyle = this.color;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = this.color;
    ctx.stroke();
    // ctx.closePath(); // Not sure if necessary
  }

  update(particles, player) {
    this.draw();

    // Loop over particles for collision detection
    for (let i = 0; i < particles.length; i++) {
      // Never compare particle to itself, skips if true.
      if (this === particles[i]) continue;

      const dist = distance(this.x, this.y, particles[i].x, particles[i].y);

      if (dist - this.radius - particles[i].radius < 0) {
        // Elastic collision
        resolveCollision(this, particles[i]);

        // Light up particles on collision
        this.opacity = 0.6;
        particles[i].opacity = 0.6;
      }
    }

    // Reset back to transparent after collision
    if (this.opacity > 0.02) {
      this.opacity -= 0.02;
      this.opacity = Math.max(0, this.opacity);
    }

    if (this.wallCollision) {
      // Collision detection for walls
      const w = wall ? 105 : 0;
      if (this.x - this.radius <= w || this.x + this.radius >= innerWidth) {
        this.velocity.x = -this.velocity.x;
      }
      if (this.y - this.radius <= 0 || this.y + this.radius >= innerHeight) {
        this.velocity.y = -this.velocity.y;
      }
    } else {
      // Particles can go offscreen and come back opposite side
      if (this.x - this.radius > innerWidth) this.x = 0 - this.radius;
      if (this.x + this.radius < 0) this.x = innerWidth + this.radius;
      if (this.y - this.radius > innerHeight) this.y = 0 - this.radius;
      if (this.y + this.radius < 0) this.y = innerHeight + this.radius;
    }

    // Player object collision (should I handle in player class?)
    const playerDistance = distance(this.x, this.y, player.x, player.y);
    if (playerDistance - this.radius - player.radius <= 0) {
      this.opacity = 1;
      cancelAnimationFrame(frameRequest);
      draw();
      setTimeout(() => {
        alert("You lose");
        init();
        animate();
      });
    }

    // Set particles to next position
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.speed = 3;
    this.radius = radius;
    this.color = color;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
  update(wall) {
    this.draw();
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const angle = Math.atan2(dy, dx);
    const xVelocity = Math.cos(angle) * this.speed;
    const yVelocity = Math.sin(angle) * this.speed;

    // Only update player if distance from mouse greater than 2
    // I must be able to simplify this if else chain though, maybe?
    // Gross disgusting 3am code
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      if (wall) {
        if (this.x + this.radius >= 95 && dx > 2) {
          this.x = 95 - this.radius;
        } else {
          this.x += xVelocity;
        }
      } else {
        this.x += xVelocity;
      }

      this.y += yVelocity;
    }
  }
}

class Goal {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.fill = false;
  }
  draw() {
    if (this.fill === true) {
      ctx.fillStyle = "#7bf977";
      ctx.fillRect(this.x, this.y, this.width, this.height);
      cancelAnimationFrame(frameRequest);
      setTimeout(() => {
        alert(`You beat level ${level + 1}!`);
        if (level < particleConfigs.length - 1) {
          level += 1;
        } else {
          level = 0;
        }
        init();
        animate();
      });
    } else {
      ctx.strokeStyle = "#7bf977";
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }

  update(player) {
    this.draw();
    if (
      player.x - player.radius > this.x &&
      player.y - player.radius > this.y &&
      player.y + player.radius < this.y + this.height
    ) {
      this.fill = true;
    } else {
      this.fill = false;
    }
  }
}

// Create particle objects
function particleCreator(level) {
  const p = [];
  const wallEnd = 105;
  const objects = level.objects();

  for (let i = 0; i < objects; i++) {
    const radius = level.radius();
    let x = level.x(radius, wallEnd);
    let y = level.y(radius);
    const xS = level.xSpeed();
    const yS = level.ySpeed();
    const color = level.color();

    // Skip first generation, only 1 circle
    if (i !== 0) {
      // Keep track of retries for a no overlap circle
      let retries = 0;

      for (let j = 0; j < p.length; j++) {
        if (retries > 100) {
          console.log("Not enough space for circles!");
          break;
        }
        const dist = distance(x, y, p[j].x, p[j].y);

        if (dist - radius - p[j].radius < 0) {
          // The + 105 here is for the wall
          x = level.x(radius, wallEnd);
          y = level.y(radius);

          // Reset loop to check if replacement
          // circle has overlap itself.
          j = -1;
          retries++;
        }
      }
    }

    p.push(new Particle(x, y, radius, color, xS, yS, level.wallCollision));
  }
  return p;
}

function init() {
  particles = [];
  player = null;
  wall = true;
  goal = null;

  // Create particle objects
  particles = particleCreator(particleConfigs[level]);

  // Create player object
  const pR = 30;
  const pX = randInt(pR, 100 - pR);
  const pY = randInt(pR, canvas.height - pR);
  player = new Player(pX, pY, pR, "red");

  // Create goal object
  const goalWidth = 100;
  const goalHeight = 160;
  const goalX = canvas.width - goalWidth;
  const goalY = canvas.height / 2 - goalHeight / 2;
  goal = new Goal(goalX, goalY, goalWidth, goalHeight);

  return "Initialized game objects.";
}

// The animation loop
function animate() {
  frameRequest = requestAnimationFrame(animate);

  // Clear canvas for next draw
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw goal, detects if player has entered.
  goal.update(player);

  if (wall === true) {
    // Draw left start area barrier
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.lineTo(100, canvas.height);
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#eeeeee";
    ctx.stroke();
    draw();
  } else {
    particles.forEach((p) => {
      p.update(particles, player);
    });
  }

  player.update(wall);

  // Draw and update particles
  // particles.forEach((p) => {
  //   p.update(particles, player);
  // });
}

// For testing to see first render. Comment out animate().
function draw() {
  particles.forEach((p) => {
    p.draw();
  });
}

// Calling this anytime init gets called, idk about the setup though
function balls() {
  return Math.floor(innerHeight / 100 + innerWidth / 200);
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;
// canvas.style.background = "linear-gradient( 135deg, #F97794 10%, #623AA2 60%)";
canvas.style.background = "#0c0c0c";

// Colors for randomColor function
const colors = ["#2185C5", "#7ECEFD", "#FFF6E5", "#FF7F66"];

let mouse = {
  x: 30,
  y: innerHeight / 2,
};

let level = 0;

let wall = true;

// Objects for canvas
let particles;
let player;
let goal;

let frameRequest;

// Options for particle objects
const particleConfigs = [
  {
    objects: () => balls(),
    radius: () => Math.random() * 60 + 15,
    x: (radius, wall) => randInt(radius + wall, canvas.width - radius),
    y: (radius) => randInt(radius, canvas.height - radius),
    xSpeed: () => (Math.random() - 0.5) * 5,
    ySpeed: () => (Math.random() - 0.5) * 5,
    color: () => getColor(),
  },
  {
    wallCollision: false,
    objects: () => balls() + 10,
    radius: () => 30,
    x: (radius, wall) => randInt(radius + wall, canvas.width - radius),
    y: (radius) => randInt(radius, canvas.height - radius),
    ySpeed: () => (Math.random() - 0.5) * 8,
    xSpeed: () => (Math.random() - 0.5) * 1,
    color: () => randomColor(colors),
  },
  {
    objects: () => balls() + 20,
    radius: () => 10,
    x: (radius, wall) => randInt(radius + wall, canvas.width - radius),
    y: (radius) => randInt(radius, canvas.height - radius),
    xSpeed: () => 3,
    ySpeed: () => 0,
    color: () => niceColor(),
  },
  {
    objects: () => balls() - 5,
    radius: () => 100,
    x: (radius, wall) => randInt(radius + wall, canvas.width - radius),
    y: (radius) => randInt(radius, canvas.height - radius),
    xSpeed: () => (Math.random() - 0.5) * 2,
    ySpeed: () => (Math.random() - 0.5) * 2,
    color: () => getColor(),
  },
];

// Updates mouse state
addEventListener("mousemove", (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
});

// Resizing resets game
addEventListener("resize", (event) => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  init();
});

addEventListener("click", (event) => {
  const clickDistance = distance(
    event.clientX,
    event.clientY,
    player.x,
    player.y
  );

  // If click happens within radius of player circle, set wall to false
  if (clickDistance < player.radius) {
    wall = false;
  }
});

// Right click resets game
addEventListener("contextmenu", (event) => {
  event.preventDefault();
  init();
});

init();
animate();
