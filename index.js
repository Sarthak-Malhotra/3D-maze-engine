// SERVER CODE (index.js) - Method 1: Server-side position tracking

const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

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

let test = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 2, 1],
    [1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 2, 1, 0, 1, 0, 1, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

let playerPositions = new Map();

io.on("connection", (socket) => {
  console.log("a user connected:", socket.id);

  let spawnX, spawnY;
  let found = false;
  for (let y = 0; y < grid.length && !found; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] != 0 && grid[y][x] != 1 && typeof grid[y][x] != "string") {
        spawnX = x;
        spawnY = y;
        playerPositions.set(socket.id, {
          x: x,
          y: y,
          originalTile: grid[y][x] 
        });
        grid[y][x] = socket.id;
        found = true;
        break;
      }
    }
  }
  
  console.log("Player spawned at:", spawnX, spawnY);
  console.log(grid);
  socket.emit('playerSpawn', grid, socket.id);
  
  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
    
    if (playerPositions.has(socket.id)) {
      let pos = playerPositions.get(socket.id);
      grid[pos.y][pos.x] = pos.originalTile;
      playerPositions.delete(socket.id);
    }
    
    console.log(grid);
    io.emit('playerDespawn', grid);
  });

  socket.on('playerMoveRequest', (moveData) => {
    let { from, to, playerId } = moveData;
    let [fromX, fromY] = from;
    let [toX, toY] = to;
    
    if (toY >= 0 && toY < grid.length && 
        toX >= 0 && toX < grid[0].length && 
        grid[toY][toX] !== 1 &&
        playerPositions.has(playerId)) {
      
      let playerPos = playerPositions.get(playerId);
      grid[fromY][fromX] = playerPos.originalTile;
      
      let newOriginalTile;
      if (typeof grid[toY][toX] === "string") {
        newOriginalTile = 0;
      } else {
        newOriginalTile = grid[toY][toX];
      }
      
      playerPositions.set(playerId, {
        x: toX,
        y: toY,
        originalTile: newOriginalTile
      });
      
      grid[toY][toX] = playerId;
      
      console.log("Player moved:", playerId, "from", from, "to", to);
      console.log(grid);
      
      io.emit('playerMoved', grid);
    }
  });
});

http.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});