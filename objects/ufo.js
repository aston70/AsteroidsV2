class UFO {
    
  constructor(ship, bulletSound) {
    this.ship = ship;
    this.pos = createVector(Math.random() * window.innerWidth, window.innerHeight-100);
    this.vel = createVector(0, 0);
    this.size = 50; // UFO size
    this.speed = Math.random() * 0.8 + 0.4; // Slower speed between 0.4 and 1.2
    this.direction = Math.random() > 0.5 ? 1 : -1; // UFO moves left or right
    this.active = true;
    this.element = document.createElement('div');
    this.element.classList.add('ufo');
    this.color = color(0, 255, 0);  // Green color
    this.shipCollision = false;
    this.bulletSound = bulletSound;
    this.heading = 0;
    this.rotation = 0;
    this.isBoosting = false;
    this.maxHealth = 100;
    this.health = 100;    
    this.burstCount = 0;
    this.lastShotTime = 0;
    this.burstDelay = 900; // time between firing bursts
    this.shotInterval = 50; // time between each shot in the burst
    this.maxHealth = 100;
    this.health = 100;
    
    document.body.appendChild(this.element);
    
    this.ufoBullets = []; 

  }

  update() {
    this.heading += this.rotation;
    if (this.isBoosting) this.boost();
    this.pos.add(this.vel);
    this.vel.mult(0.99);
    this.edges();
  }

  display() {
      push();
      // Translate to UFO's position
      translate(this.pos.x, this.pos.y);

      // Rotate the UFO according to its heading
      rotate(this.heading);

      // Draw the rotating triangle indicating direction
      fill(0, 255, 0); // Green color
      stroke(0, 255, 0);
      strokeWeight(2);
      beginShape();
      vertex(0, -this.size / 2); // Top point of triangle (point of arrow)
      vertex(-this.size / 4, this.size / 4); // Bottom left point
      vertex(this.size / 4, this.size / 4); // Bottom right point
      endShape(CLOSE);

      // Light blue glow effect around UFO
      fill(0, 216, 230, 50);
      ellipse(0, 0, this.size * 1.4, this.size / 1.5);

      // Main UFO shape (saucer)
      fill(this.color); // UFO green
      ellipse(0, 0, this.size, this.size / 2);

      // Canopy Top (smaller dome on top of the UFO)
      fill(0, 128, 255); // Blue dome
      ellipse(0, -this.size / 4, this.size * 0.7, this.size / 3);

      pop();
  }

  setRotation(angle) {
    this.rotation = angle;
  }  
  
  boosting(b) {
    this.isBoosting = b;
  }

  boost() {
    let force = p5.Vector.fromAngle(this.heading - HALF_PI);
    force.mult(0.1);
    this.vel.add(force);
  }
  
  fireBulletAtShip() {
    
    if (gameOver) {
        this.destroy();
        return;
    }

    let currentTime = millis();

    // If in the middle of a burst, enforce delay between shots
    if (this.burstCount > 0 && currentTime - this.lastShotTime < this.shotInterval) {
        return;
    }

    // If the burst is complete, wait for 2 seconds before shooting again
    if (this.burstCount === 3) {
        if (currentTime - this.lastShotTime < this.burstDelay) {
            return;
        }
        this.burstCount = 0; // Reset burst count after cooldown
    }

    const shipX = this.ship.pos.x;
    const shipY = this.ship.pos.y;

    // Calculate angle to ship
    const angle = Math.atan2(shipY - this.pos.y, shipX - this.pos.x);

    // Create a bullet directed at the ship
    const brightBlue = [0, 191, 255];
    const bullet = new Bullet(
        this,
        createVector(this.pos.x, this.pos.y),
        angle + HALF_PI,
        brightBlue
    );
    this.ufoBullets.push(bullet);

    if (this.active && this.bulletSound) {
        this.bulletSound.play();
    }

    // When the ship knows it's being fired upon it will
    // try to dodge bullets by moving into the most open area.
    this.ship.isBeingFiredUpon = true;
    
    // Track burst firing
    this.lastShotTime = currentTime;
    this.burstCount++;
  }

  destroy() {
    if (!this.active) return;

    this.active = false;

    // Stop UFO bullet sounds
    if (this.bulletSound && this.bulletSound.isPlaying()) {
      this.bulletSound.stop();
    }

    // Clean up UFO bullets and their sounds
    for (let bullet of this.ufoBullets) {
      if (bullet.sound && bullet.sound.isPlaying()) {
        bullet.sound.stop();
      }
    }
    this.ufoBullets = [];

    this.remove();
  }

  takeDamage(amount) {
    this.health -= amount;
    this.updateColor();
    console.log(`UFO health: ${this.health}`);
  }
  
  updateColor() {
    if (this.health !== undefined && this.maxHealth !== undefined) {
      let red = map(this.health, 0, this.maxHealth, 139, 255);
      let green = map(this.health, 0, this.maxHealth, 0, 100);
      this.color = color(red, green, 0);
    }
  }  
  
  edges() {
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.y > height) this.pos.y = 0;
    if (this.pos.y < 0) this.pos.y = height;
  }  
  
  remove() {
    if (this.element) {
      this.element.remove(); 
    }

    if (this.firingInterval) {
      clearInterval(this.firingInterval);
    }
    
  }
}
