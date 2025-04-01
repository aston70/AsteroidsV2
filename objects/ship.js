class Ship {
  constructor() {
    this.pos = createVector(width / 2, height / 2); // Initialize position
    this.vel = createVector(0, 0);
    this.heading = 0;
    this.rotation = 0;
    this.isBoosting = false;
    this.maxHealth = 100;
    this.health = 100;
    this.size = 50;
    this.color = color(200);
    this.isBeingFiredUpon = false;
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.heading);
    fill(this.color);
    stroke(255);
    strokeWeight(2);
    this.drawShipBody();
    this.drawWings();
    this.drawExhaust();
    pop();
  }

  drawShipBody() {
    beginShape();
    vertex(-12, 10);
    vertex(12, 10);
    vertex(18, -10);
    vertex(0, -20);
    vertex(-18, -10);
    endShape(CLOSE);
  }

  drawWings() {
    fill(150);
    this.drawLeftWing();
    this.drawRightWing();
  }

  drawLeftWing() {
    beginShape();
    vertex(-12, 10);
    vertex(-24, 0);
    vertex(-24, -10);
    vertex(-12, -10);
    endShape(CLOSE);
  }

  drawRightWing() {
    beginShape();
    vertex(12, 10);
    vertex(24, 0);
    vertex(24, -10);
    vertex(12, -10);
    endShape(CLOSE);
  }

  drawExhaust() {
    fill(255, 0, 0);
    triangle(0, 10, -3, 20, 3, 20);
  }

  hits(target) {
       
    let shipRadius = this.size / 2;
    
    // Handle asteroid collision
    if (target.constructor.name === 'Asteroid') {
      let d = dist(this.pos.x, this.pos.y, target.pos.x, target.pos.y);
      return d < target.r + shipRadius;
    }

    // Handle UFO collision
    if (target.constructor.name === 'UFO') {
      let ufoRadius = target.size / 2;
      let d = dist(this.pos.x, this.pos.y, target.pos.x, target.pos.y);
      return d < ufoRadius + shipRadius;
    }

    return false;  // No collision
  }      
  
  takeDamage(amount) {
    this.health -= amount;
    this.updateColor();
    console.log(`Ship health: ${this.health}`);
  }

  updateColor() {
    if (this.health !== undefined && this.maxHealth !== undefined) {
      let red = map(this.health, 0, this.maxHealth, 139, 255);
      let green = map(this.health, 0, this.maxHealth, 0, 100);
      this.color = color(red, green, 0);
    }
  }
    
}