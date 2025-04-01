class ShipMovement {
  constructor(ship, ufo, asteroids) {
    this.ship = ship;  // Ship reference
    this.ufo = ufo;    // UFO reference 
    this.asteroids = asteroids; // Array of asteroids
    this.isBoosting = false;
    this.rotation = 0;
    this.closeRangeAsteroidDist = 200; // range of close asteroids.
    this.lastFiredTime = 0;    // Timer to control shooting intervals
    this.shootInterval = 400;  // Interval for auto-shoot in milliseconds    
    this.shootingCooldown = 0; // Add cooldown to avoid shooting too fast
    this.avoidanceDistance = 150;  // Detection range for asteroids
    this.slowDownDistance = 100;   // Distance to slow down when an asteroid is in front
    this.slowDownFactor = 0.1;  // Factor by which to reduce speed when slowing down
    this.shootDistance = 300;   // Distance at which ship can shoot an asteroid
    this.avoidanceAngleThreshold = 0.3; // Threshold for avoiding asteroids (less than 0.3 radians)
    this.lastBulletSpeed = 0;
    this.ufoDetectionRange = 250;
  }

  update() {
    // Handle asteroid avoidance
    this.avoidAsteroids();
    
    // Handle slowing down if necessary
    //this.slowDownIfNecessary();

    if(this.ship.isBeingFiredUpon){
      this.moveToOpenArea();
      this.ship.isBeingFiredUpon = false;
    }
    
    if (!this.isBoosting)
    {
      
      // Prioritize aiming at the UFO if it's in range
      if (this.isUFOInRange()) {
          this.aimAtUFO();
      } else {
          // Find the closest in-range asteroid to aim at and shoot.
          // If there are no close asteroids, shoot at the largest one.
          if (!this.aimAtClosestAsteroid()) {      
              this.aimAtLargestAsteroidWithLead();
          }
      }

      // Iterate over all bullets and check if they missed
      for (let bullet of bullets) {
        if (bullet.checkIfMissed()) {
          this.missedTargetCount++;
          this.adjustForMiss();  // Adjust behavior if we miss
        }
      }   
      
    }
      
    // Apply movement and friction
    this.ship.pos.add(this.ship.vel);
    this.ship.vel.mult(0.99);  // Apply velocity friction

    // Update position and velocity
    this.ship.heading += this.rotation;
    this.edges();
  }

  aimAtClosestAsteroid() {
    
    let closestAsteroid = null;
    let closestDist = Infinity;

    // Find the closest asteroid
    for (let asteroid of this.asteroids) {
      let distToAsteroid =
          dist(this.ship.pos.x,
               this.ship.pos.y,
               asteroid.pos.x,
               asteroid.pos.y);
      
      if (distToAsteroid <= this.closeRangeAsteroidDist) {
        if (distToAsteroid < closestDist) {
          closestDist = distToAsteroid;
          closestAsteroid = asteroid;
        }
      }
    }

    // If we found the closest asteroid, aim at it
    if (closestAsteroid) {
      let angleToAsteroid = 
          atan2(closestAsteroid.pos.y - this.ship.pos.y,
                closestAsteroid.pos.x - this.ship.pos.x);
      
      // Rotate ship to aim at the closest asteroid.
      this.ship.heading = (angleToAsteroid + HALF_PI);
      
      // Fire at the closest asteroid
      this.fireAtTarget(closestAsteroid);

      return true;
    }
    
    return false;
    
  }  
  
  aimAtFarthestAsteroid() {
    
    let farthestAsteroid = null;
    let farthestDist = -Infinity;

    // Find the farthest asteroid.
    for (let asteroid of this.asteroids) {
      let distToAsteroid =
          dist(this.ship.pos.x,
               this.ship.pos.y,
               asteroid.pos.x,
               asteroid.pos.y);
      
      if (distToAsteroid > farthestDist) {
        farthestDist = distToAsteroid;
        farthestAsteroid = asteroid;
      }      
    }
    
   }
  
  aimAtLargestAsteroid() {
    
    let largestAsteroid = null;
    let largestSize = 0;

    // Find the largest asteroid.
    for (let asteroid of this.asteroids) {
      if (asteroid.size > largestSize) {
        largestSize = asteroid.size;
        largestAsteroid = asteroid;
      }
    }

    // If we found the largest asteroid, aim at it.
    if (largestAsteroid) {
      let angleToAsteroid = 
          atan2(largestAsteroid.pos.y - this.ship.pos.y,
                largestAsteroid.pos.x - this.ship.pos.x);
      
      // Rotate ship to aim at the largest asteroid.
      this.ship.heading = (angleToAsteroid + HALF_PI);

      // Fire at the largest asteroid
      this.fireAtTarget(largestAsteroid);      
    }
  }
  
  aimAtLargestAsteroidWithLead() {
    let largestAsteroid = null;
    let largestRadius = 0;

    // Find the largest asteroid (based on radius)
    for (let asteroid of this.asteroids) {
      if (asteroid.r > largestRadius) {
        largestRadius = asteroid.r;
        largestAsteroid = asteroid;
      }
    }

    // If we found the largest asteroid, aim at it
    if (largestAsteroid) {
      
      // Calculate the distance from the ship to the asteroid
      let distanceToAsteroid = 
          dist(this.ship.pos.x,
               this.ship.pos.y,
               largestAsteroid.pos.x,
               largestAsteroid.pos.y);

      // Calculate the estimated time it would
      // take for the bullet to reach the asteroid.
      let bulletSpeed = 7;  // Speed of the bullet (you may adjust this value)
      let timeToImpact = distanceToAsteroid / bulletSpeed;  // Time to impact in seconds

      // Predict the asteroid's future position
      let predictedAsteroidX = 
          largestAsteroid.pos.x + largestAsteroid.vel.x * timeToImpact;
      let predictedAsteroidY = 
          largestAsteroid.pos.y + largestAsteroid.vel.y * timeToImpact;

      // Calculate the angle to the predicted position of the asteroid
      let angleToPredictedPosition =
          atan2(predictedAsteroidY - this.ship.pos.y,
                predictedAsteroidX - this.ship.pos.x);

      // Rotate ship to aim at the predicted asteroid position.
      this.ship.heading = (angleToPredictedPosition + HALF_PI);

      // Fire at the predicted position of the asteroid.
      let lastBullet = this.fireAtTarget(largestAsteroid);                
      if (lastBullet) {
        this.lastBulletSpeed = lastBullet.speed;
      }
      
    }
  }  
      
  aimAtUFO() {
    if (!this.ufo) return;

    let angleToUFO = atan2(
      this.ufo.pos.y - this.ship.pos.y,
      this.ufo.pos.x - this.ship.pos.x
    );

    this.ship.heading = angleToUFO + HALF_PI;
    
    this.fireAtTarget(this.ufo);
  }
 
  // Function to fire at an object. ie. UFO or Asteroid
  fireAtTarget(target) {
    let currentTime = millis();

    // Only fire if enough time has passed since the last shot (500ms cooldown)
    if (currentTime - this.lastFiredTime > this.shootInterval) {
      this.lastFiredTime = currentTime;  // Update last fired time

      // Fire a bullet
      return this.fireBullet(target);
    }
  }

  fireBullet(target)
  {
    const bulletColor = [255, 0, 0];
    let bullet = new Bullet(this.ship, this.ship.pos.copy(), this.ship.heading, bulletColor);
    
    if(target){
      bullet.setTarget(target);
    }
    
    bullets.push(bullet);   
    playSound(bulletSound);
    return bullet;
  }    
  
  adjustForMiss() {
    if (this.missedTargetCount > 2) {
      // If we've missed multiple times, adjust behavior.
      console.log("Missed target, adjusting aim and fire rate.");
      this.missedTargetCount = 0;  // Reset the count

      // Adjust bullet speed or aim based on the situation.
      // Increase speed or aim adjustments to catch up with the target.
      this.lastBulletSpeed *= 1.2;  
      this.fireBullet();  // Fire another shot
    }
  }  
  
  isUFOInRange() {
      if (!this.ufo) return false; // Ensure UFO exists

      let distance = dist(this.ship.pos.x, this.ship.pos.y, this.ufo.pos.x, this.ufo.pos.y);
      return distance < this.ufoDetectionRange; // Replace with your preferred detection range
  }  
  
  edges() {
    // Handle the ship's position when it crosses the canvas edges
    if (this.ship.pos.x > width) {
      this.ship.pos.x = 0;  // Wrap to the left side
    }
    if (this.ship.pos.x < 0) {
      this.ship.pos.x = width;  // Wrap to the right side
    }

    if (this.ship.pos.y > height) {
      this.ship.pos.y = 0;  // Wrap to the top
    }
    if (this.ship.pos.y < 0) {
      this.ship.pos.y = height;  // Wrap to the bottom
    }
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
    this.ship.vel.add(force);
  } 
  
  avoidAsteroids() {
    // Iterate through all asteroids to avoid collisions
    for (let asteroid of this.asteroids) {
      let distToAsteroid =
          dist(this.ship.pos.x,
               this.ship.pos.y,
               asteroid.pos.x,
               asteroid.pos.y);

      // Close enough to avoid
      if (distToAsteroid < this.avoidanceDistance) { 
        let angleToAsteroid = 
            atan2(asteroid.pos.y - this.ship.pos.y,
                  asteroid.pos.x - this.ship.pos.x);

        // Calculate angle difference to the asteroid and decide avoidance
        let angleDiff = abs(this.ship.heading - angleToAsteroid);
        if (angleDiff < this.avoidanceAngleThreshold) {
          
          // Smoothly adjust the ship's heading away from the asteroid.
          // Rotate 180 degrees
          this.rotation = 
            lerp(this.rotation,
                 angleToAsteroid + PI - this.ship.heading, 0.1);
          this.boost();
        }
      }
    }
  }  
    
  moveToOpenArea() {
    
    if (!this.ship.pos || !this.ufo) return;

    let bestDirection = null;
    let maxDistance = 0;

    let step = 10;  
    let directions = [
      createVector(1, 0),    // Right
      createVector(-1, 0),   // Left
      createVector(0, 1),    // Down
      createVector(0, -1),   // Up
      createVector(1, 1),    // Diagonal Bottom-Right
      createVector(-1, 1),   // Diagonal Bottom-Left
      createVector(1, -1),   // Diagonal Top-Right
      createVector(-1, -1)   // Diagonal Top-Left
    ];

    for (let dir of directions) {
      let distance = this.checkDistanceToUFO(dir, ufo);
      if (distance > maxDistance) {
        maxDistance = distance;
        bestDirection = dir;
      }
    }

    if (bestDirection) {
      // Apply a boosting force toward the most open area
      let force = bestDirection.copy().mult(2);  // Boost strength
      this.ship.vel.add(force);  
      this.ship.isBoosting = true;  
    }
  }
  
  checkDistanceToUFO(dir) {
    if (!this.ship.pos) return 0;  // Avoid undefined error

    let testPos = this.ship.pos.copy();
    let step = 10;  
    let distance = 0;

    while (
      testPos.x > 0 && 
      testPos.x < width && 
      testPos.y > 0 && 
      testPos.y < height)
    {
      testPos.add(dir.copy().mult(step));  // Use copy to avoid modifying the original
      distance += step;

      if (this.ufo && this.ufo.ufoBullets) {
        for (let bullet of this.ufo.ufoBullets) {
          if (p5.Vector.dist(testPos, bullet.pos) < 30) {
            return distance;  
          }
        }
      }
    }

    return distance;
  }

}