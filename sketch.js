// Scoring: 
// Score hits bullet on ship.
// Bonbus points: Extra points for each remaining asteroid after game over.
// Points if ship crashes into asteroid.

const highScoreID = "highScorev2";
let pauseGame = true;
let ship;
let shipMovement;
let ufo;
let ufoInterval;
let ufoMoveInterval = null;
let asteroidCount = 5;
let asteroids = [];
let bullets = [];
let gameOver = false;
let startGameButton;
let playAgainButton;
let winGame = false;
let score = 0;
let highScore = localStorage.getItem(highScoreID) ? parseInt(localStorage.getItem(highScoreID)) : 0;
let stars = [];
let numStars = 500;
const resetHighscorePosition = { widthOffset: 170, y: 65 };

function preload() {   
  loadSounds();
}

function getCanvasSize() {  
  return { x: windowWidth, y: windowHeight - 40 };
}

function windowResized() {
  let canvaseSize = getCanvasSize();
  resizeCanvas(canvaseSize.x, canvaseSize.y);
  
  if (startGameButton) {
    positionGameButton(startGameButton, height / 2 + 20);
  }
  if (playAgainButton) {
    positionGameButton(playAgainButton, height / 2 + 70);
  }
  if (resetHighScoreButton) {
    resetHighScoreButton.position(
      width - resetHighscorePosition.widthOffset, resetHighscorePosition.y);
  }
  createStars();
}

function setup() {
  
  let canvaseSize = getCanvasSize();
  createCanvas(canvaseSize.x, canvaseSize.y);
  
  // If sound gets crashy - turn it off with this...
  //getAudioContext().suspend(); // Suspend audio context
  
  createPlayAgainButton();
  createResetHighScoreButton();  
  createStartGameButton();  
}

function draw() {
    
  if (pauseGame) { 
    return;
  }
  
  background(0);

  if (gameOver) {
    displayGameOver();
  } else {
    updateAndShowGameObjects();
  }

  displayScore();
  displayHealth();
  
}


function resetGame() {
  
  gameOver = false;
  winGame = false;
  asteroids = [];
  bullets = [];
  ship = null;
  ufo = null;
  
  // Call loadSounds and pass in a callback that will run once all sounds are loaded
  loadSounds(() => {
    console.log("Game reset and sounds are ready!");
    startGame();
  });  
}

function startGame() {
  
  pauseGame = false;
  
  if(startGameButton) {
    startGameButton.hide();
  }
  score = 0;
  createStars();
    
  winGame = false;
  gameOver = false;

  // Clear bullets, UFO bullets, and asteroids
  asteroids = [];
  bullets = [];
    
  resetHighScoreButton.hide();
  playAgainButton.hide();
  loop();
    
  ship = new Ship();  
  createAsteroids();    
 
  ufo = new UFO(ship, ufoBulletSound);
  
  shipMovement = new ShipMovement(ship, ufo, asteroids); 
  
  if (soundsLoaded.gameplaySound) {
    gamePlaySoundLoaded();
  }
}

function keyPressed() {
  if(gameOver) {
    return;
  }
  
  if (keyCode === RIGHT_ARROW && ufo) {
    ufo.setRotation(0.1);
  }
  else if (keyCode === LEFT_ARROW && ufo) {
    ufo.setRotation(-0.1);
  }
  else if (keyCode === UP_ARROW && ufo) {
    if(ufo && !ufo.isBoosting) {
      ufo.boosting(true);
      playSound(thrustSound, true);
    }    
  } 
  else if (key === ' ' && ufo) {
    ufo.fireBulletAtShip();
  }
  else
  {
    console.log("No UFO!!!");
  } 
    
}

function keyReleased() {
  if ((keyCode === RIGHT_ARROW || keyCode === LEFT_ARROW) && ufo) {
    ufo.setRotation(0);
  }
  if (keyCode === UP_ARROW && ufo) {
    ufo.boosting(false);
    stopSound(thrustSound);
  }
  else if (key === ' ') {
    stopSound(bulletSound);
  }
}

function createAsteroids() {
  for (let i = 0; i < asteroidCount; i++) {
    let asteroid = new Asteroid();
    while (dist(asteroid.pos.x, asteroid.pos.y, ship.pos.x, ship.pos.y) < 150) {
      asteroid = new Asteroid();
    }
    asteroids.push(asteroid);
  }
}

function createStartGameButton() {
  startGameButton = createButton('Start Game');
  startGameButton.size(200, 50);
  startGameButton.style('font-size', '24px');
  startGameButton.mousePressed(startGame);
  positionGameButton(startGameButton, height / 2 + 20);
  startGameButton.show();
}

function createPlayAgainButton() {
  playAgainButton = createButton('Play Again');
  playAgainButton.size(200, 50);
  playAgainButton.style('font-size', '24px');
  playAgainButton.mousePressed(resetGame);
  positionGameButton(playAgainButton, height / 2 + 50);
  playAgainButton.hide();
}

function positionGameButton(button, y) {
  if(button) {
       button.position(width / 2 - button.width / 2, y);
  }
}

function createResetHighScoreButton() {
  // Create the reset button once
  resetHighScoreButton = createButton('Reset High Score');
  resetHighScoreButton.size(150, 30);   // Smaller size
  resetHighScoreButton.style('font-size', '14px');
  resetHighScoreButton.mousePressed(resetHighScore);
  resetHighScoreButton.hide();
  resetHighScoreButton.position(
    width - resetHighscorePosition.widthOffset, resetHighscorePosition.y);  
}

function showPlayAgain() {
  playAgainButton.show();   
}

function showResetHighScore() {
  resetHighScoreButton.show();
}

function updateAndShowGameObjects() {
  
  // Display and move stars
  for (let star of stars) {
    star.move();
    star.display();
  }   
  
  if (ufo)
  {
    ufo.update();
    ufo.display();
    //ufo.handleUFObullets();  
  }
  
  if (ship && shipMovement) {
      
      ship.show();
      shipMovement.update();

      if (ship.health <= 0) {
        winGame = true;
        gameOver = true;
        incrementScore(Points.shipDestroyed);
      }
    
    handleBullets();
    handleUFObullets();
  }  
 
  if (ufo) {
    if (ufo.health <= 0) {
      winGame = false;
      gameOver = true;
    }
  } 

  handleAsteroids();
  checkUfoCollision();
}

function handleBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].show();

    if (bullets[i].offscreen()) {
      bullets.splice(i, 1);
    } else {
      checkBulletCollisions(i);
    }
  }
}

function checkBulletCollisions(i) 
{
   
  // If a ship fired bullet hits the UFO...
  if (ufo && bullets[i].hits(ufo)) {
    console.log("Bullet hit UFO");
    if (!ufoHitSound.isPlaying()) {
      ufo.takeDamage(20);
      ufoHitSound.play();
    }    
    
    bullets.splice(i, 1); // Remove the bullet
    //ufo.destroy(); // Destroy the UFO
   
    return; // Exit early since the bullet hit the UFO
  }

  // Then, check for collision between bullet and asteroids
  for (let j = asteroids.length - 1; j >= 0; j--) {
    if (bullets[i].hits(asteroids[j])) {
      bullets.splice(i, 1); // Remove the bullet
      asteroids[j].breakup(); // Break asteroid apart
      asteroids.splice(j, 1); // Remove the asteroid from the array

      // Check if all asteroids are destroyed. If so, then you lose!!
      if (asteroids.length === 0) {
        winGame = false;
        gameOver = true;
      }
      break; // Exit the loop once collision is detected
    }
  }
}


function handleUFObullets() {  
    for (let i = ufo.ufoBullets.length - 1; i >= 0; i--) {
      ufo.ufoBullets[i].update();
      ufo.ufoBullets[i].show();

      if (ufo.ufoBullets[i].offscreen()) {
        stopSound(ufoBulletSound);    
        ufo.ufoBullets.splice(i, 1);
      } else {
        checkUFOBulletCollisions(i);  // Call method on the same object
      }
    }
  }

function checkUFOBulletCollisions(i) {
  if (ufo.ufoBullets[i].hits(ship)) {
    ship.takeDamage(10);
    incrementScore(Points.shipBulletHit);
    stopSound(ufoBulletSound);
    ufo.ufoBullets.splice(i, 1);
  }
}

function checkUfoCollision() {   
  if (ship && ufo && !ufo.shipCollision && ship.hits(ufo)) {
    ufo.shipCollision = true;
    ship.takeDamage(50);
    incrementScore(Points.ufoShipCollision);
  }
}

function handleAsteroids() {
  for (let a of asteroids) {
    a.update();
    a.show();
    
    if (ship.hits(a)) {
      playSound(spaceshipHitSound);
      winGame = true;
      gameOver = true;
    }
    
  }
}


function displayGameOver() {
  
  let message = "";  // Store win/loss message
  let messageColor;
  
  stopSound(gameplaySound);
  stopSound(thrustSound);
  
  console.log("Game Over!");
  noLoop();

  if (winGame) {    
    console.log("You Win!");
    calculateBonusPoints();
    updateHighScore();
    playSound(youWinSound);
    message = "You Win!";
    messageColor = color(0, 255, 0);  // Green for win
  }
  else {
    console.log("You Lose!");
    playSound(youLoseSound);
    message = "You lose!";
    messageColor = color(255, 0, 0);  // Red for lose
  }
  
  if(ufo){
    ufo.destroy();
    ufo = null;
  }
    
  // Show Game Over.
  setTimeout(() => {
    noStroke();  // Remove the outline
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(40);
    text("Game Over", width / 2, height / 2 - 50);
    fill(messageColor);
    textSize(28);
    text(message, width / 2, height / 2);   
  }, 1000);
  
  showResetHighScore();
  
  // Unload sounds and then show play again button.
  setTimeout(() => {
    unloadSounds(showPlayAgain);
  }, 3000);    

}

function calculateBonusPoints() {
  let remainingAsteroids = asteroids.length;
  let bonusPoints = remainingAsteroids * Points.remainingAsteroid;
  incrementScore(bonusPoints);
  console.log("Bonus points", bonusPoints);
}

// Display current score.
function displayScore() {
  fill(255);
  textSize(20);
  textAlign(LEFT);
  text(`Score: ${score}`, 20, 30);

  // Display high score
  textAlign(RIGHT);
  text(`High Score: ${highScore}`, width - 20, 30);
}

function displayHealth() {
  
  if(!ufo){
    return;
  }
  
  let health = constrain(ufo.health, 0, 100);
  
  fill(255);
  textSize(20);
  textAlign(LEFT);
  text(`Health: ${health}`, 20, 60);

  // Calculate the health bar color from green to red based on the health value
  let healthColor = lerpColor(color(0, 255, 0), color(255, 0, 0), 1 - (health / 100));

  // Draw the health bar
  noStroke();
  fill(healthColor); // Set fill color based on health
  rect(20, 80, 200 * (health / 100), 20); // Health bar width corresponds to health percentage

  // Optionally, you can add a border around the health bar
  stroke(255); // White border
  noFill();
  rect(20, 80, 200, 20); // Draw border around the health bar
}


// After the game ends, compare score with highScore. Update highScore
// if the current score is higher. Store the new highScore in localStorage.
function updateHighScore() {
  if (score > highScore) {
    highScore = score;  
    localStorage.setItem(highScoreID, highScore);  
  }  
}   

function resetHighScore() {
  if (confirm('Are you sure you want to reset the high score?')) {
    highScore = 0;
    localStorage.removeItem(highScoreID);
    resetHighScoreButton.hide();
  }
}

function createStars() {
  stars = [];
  for (let i = 0; i < numStars; i++) {
    stars.push(new Star());
  }    
}

function incrementScore(amount) {
  score += amount;
  displayScore();
}