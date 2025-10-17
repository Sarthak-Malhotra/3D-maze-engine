// CLIENT CODE (sketch.js) - Method 1: Server-side position tracking

let socket;
let myPlayerId;

let grid = [
[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
[1,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,1,0,1],
[1,1,0,1,0,1,0,0,0,1,0,1,0,1,0,1,0,1,0,1,1],
[1,0,0,0,1,0,1,0,1,0,0,0,1,0,1,0,1,0,1,0,1],
[1,1,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,1],
[1,0,1,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1],
[1,1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,1,0,1,1],
[1,0,1,0,1,0,0,0,1,0,0,0,1,0,1,0,1,0,1,0,1],
[1,0,0,0,0,1,0,0,0,1,0,1,0,1,0,1,0,1,0,1,1],
[1,0,0,0,1,0,0,0,1,2,0,0,0,0,1,0,1,0,1,0,1],
[1,1,0,1,0,0,0,1,0,1,0,1,0,1,0,1,0,0,0,1,1],
[1,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,1],
[1,1,0,1,0,1,0,1,0,0,0,1,0,0,0,1,0,1,0,1,1],
[1,0,0,0,1,0,1,0,0,0,1,0,1,0,1,0,1,0,0,0,1],
[1,0,0,1,0,1,0,1,0,0,0,1,0,1,0,1,0,1,0,1,1],
[1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,1,0,1,0,1],
[1,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,1],
[1,0,1,0,1,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1],
[1,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1,0,1,0,0,1],
[1,0,0,0,1,0,1,0,1,0,1,0,1,0,0,0,1,0,0,0,1],
[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]];

let walls = [];
let players = [];

let ghost;
function preload() {
  ghost = loadImage("ghost.png");
}

class wall {
  constructor(color, ...pos_data) {
    this.color = color;
    this.alpha = color._getAlpha();
    this.pos_data = pos_data;
  }

  show() {
    this.color.alpha = this.alpha;
    fill(this.color);
    quad(
      this.pos_data[0], this.pos_data[1],
      this.pos_data[2], this.pos_data[3],
      this.pos_data[4], this.pos_data[5],
      this.pos_data[6], this.pos_data[7]
    );
  }
}

class Player {
  constructor(id, dist) {
    this.pos = [];
    this.facing = 0;
    this.dist = dist;
    this.id = id;
  }

  show() {
    if (this.dist == 2) {
      image(ghost,175,175,75,75);
    }
    if (this.dist == 1) {
      image(ghost,150,150,150,150);
    }
  }
}

let player;

function setup() {
  createCanvas(400, 550);
  
  socket = io();
  
  socket.on('playerSpawn', (recievedGrid, id) => {
    grid = recievedGrid;
    myPlayerId = id;
    player = new Player(id)
    console.log(grid);
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x] === myPlayerId) {
          player.pos = [x, y];
          break;
        }
      }
    }
    locator();
    renderPlayer();
  });
  
  socket.on('playerDespawn', (recievedGrid) => {
    //myPlayerId = null;
    grid = recievedGrid;
  });

  socket.on('playerMoved', (recievedGrid) => {
    grid = recievedGrid;
    // Update player position from server grid
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x] === myPlayerId) {
          player.pos = [x, y];
          break;
        }
      }
    }
    locator();
    renderPlayer();
  });
}

function draw() {
  background(220);
  drawMap();
  text([mouseX, mouseY], mouseX, mouseY);
  
  for (let i = 0; i < walls.length; i++) {
    walls[i].show();
  }
  
  for (let i = 0; i < players.length; i++) {
    players[i].show();
  }

  // Show connection status
  if (!player) {
    fill(255, 0, 0);
    text("Connecting...", 10, 20);
  } else {
    fill(0, 255, 0);
    text("Connected - ID: " + myPlayerId, 10, 20);
    text("Position: " + player.pos, 10, 35);
  }

}

function locator() {
  let [x, y] = player.pos;
  walls = [];
  
  let segments = [
    { dx: -1, dy: 0, segmentPos: [0, 0, 50, 50, 50, 350, 0, 400] },
    { dx: 1, dy: 0, segmentPos: [350, 50, 350, 350, 400, 400, 400, 0] },
    { dx: -1, dy: -1, segmentPos: [50, 50, 100, 100, 100, 300, 50, 350] },
    { dx: -1, dy: -2, segmentPos: [100, 100, 150, 150, 150, 250, 100, 300] },
    { dx: 1, dy: -1, segmentPos: [300, 100, 300, 300, 350, 350, 350, 50] },
    { dx: 1, dy: -2, segmentPos: [300, 100, 250, 150, 250, 250, 300, 300] },
    { dx: 0, dy: -3, segmentPos: [150, 150, 150, 250, 250, 250, 250, 150] },
    { dx: 0, dy: -2, segmentPos: [100, 100, 300, 100, 300, 300, 100, 300] },
    { dx: 0, dy: -1, segmentPos: [50, 50, 350, 50, 350, 350, 50, 350] }
  ];

  for (let dir of segments) {
    let [dx, dy] = rotatePlayer(dir.dx, dir.dy, player.facing);
    let nx = x + dx;
    let ny = y + dy;

    if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
      if (grid[ny][nx] === 1) {
        walls.push(new wall(color(0, 0, 0, 255), ...dir.segmentPos));
      }
    }
  }
}

function renderPlayer() {
  let [x, y] = player.pos;
  players = [];

  let segments = [
    { dx: 0, dy: -2, segmentPos: new Player(2,2) },
    { dx: 0, dy: -1, segmentPos: new Player(1,1) },
  ];

  for (let dir of segments) {
    let [dx, dy] = rotatePlayer(dir.dx, dir.dy, player.facing);
    let nx = x + dx;
    let ny = y + dy;
    
    if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
      // Only render if there's actually a player there (not my own position)
      if (typeof grid[ny][nx] === "string" && grid[ny][nx] !== myPlayerId && grid[ny][nx] !== "1") {
        players.push(dir.segmentPos);
      }
    }
  }
}

function keyPressed() {
  let [x, y] = player.pos;

  function tryMove(dx, dy) {
    let [fx, fy] = rotatePlayer(dx, dy, player.facing);
    let nx = x + fx;
    let ny = y + fy;

    if (
      ny >= 0 && ny < grid.length &&
      nx >= 0 && nx < grid[0].length &&
      grid[ny][nx] !== 1
    ) {
      // Send move request to server instead of modifying grid directly
      socket.emit('playerMoveRequest', {
        from: [x, y],
        to: [nx, ny],
        playerId: myPlayerId
      });
    }
  }

  if (key === "w") tryMove(0, -1);
  if (key === "s") tryMove(0, 1);
  if (key === "d") player.facing = (player.facing + 3) % 4;
  if (key === "a") player.facing = (player.facing + 1) % 4;
}

function keyReleased() {
  // Remove the grid modification logic - server handles this now
  locator();
  renderPlayer();
}

function rotatePlayer(dx, dy, facing) {
  for (let i = 0; i < facing; i++) {
    [dx, dy] = [dy, -dx];
  }
  return [dx, dy];
}

function drawMap() {
  rectMode(CENTER);
  noFill();
  rect(200, 200, 100, 100);
  fill(0);
  strokeWeight(2);

  line(50, 100, 100, 100);
  line(50, 300, 100, 300);
  line(300, 300, 350, 300);
  line(300, 100, 350, 100);
  line(250, 150, 300, 150);
  line(250, 250, 300, 250);
  line(100, 150, 150, 150);
  line(100, 250, 150, 250);
  line(350, 350, 400, 350);
  line(350, 50, 400, 50);
  line(0, 50, 50, 50);
  line(0, 350, 50, 350);

  line(50, 50, 50, 350);
  line(350, 50, 350, 350);
  line(300, 300, 300, 100);
  line(100, 100, 100, 300);

  for (let i = 0; i < grid.length; i++) {
    text(grid[i], 50, i * 10 + 450);
  }
}