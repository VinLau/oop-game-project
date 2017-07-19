// This sectin contains some game constants. It is not super interesting
var GAME_WIDTH = 375;
var GAME_HEIGHT = 500;

var ENEMY_WIDTH = 75;
var ENEMY_HEIGHT = 156;
var MAX_ENEMIES = 3;

var PLAYER_WIDTH = 75;
var PLAYER_HEIGHT = 54;
var PLAYER_HEALTH = 150;

// These two constants keep us from using "magic numbers" in our code
var LEFT_ARROW_CODE = 37;
var RIGHT_ARROW_CODE = 39;
var SPACE_PRESS_CODE = 32;

// These two constants allow us to DRY
var MOVE_LEFT = 'left';
var MOVE_RIGHT = 'right';

// Preload game images
var images = {};
['enemy.png', 'stars.png', 'player.png'].forEach(imgName => {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    images[imgName] = img;
});

// GLOBAL MUSIC VARIABLE AND CONSTRUCTOR

var myMusic;

function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
        this.sound.play();
    }
    this.stop = function(){
        this.sound.pause();
    }
}

// This section is where you will be doing most of your coding

class Entity {
   render(ctx) {
      ctx.drawImage(this.sprite, this.x, this.y); //Assuming this function actually draws the cats at a given X and given Y
   }
}

class Enemy extends Entity {
    constructor(xPos) { //NOTE how x position of enemy cats receives an argument x position
        super();
        this.x = xPos;  //x position is dynamic
        this.y = -ENEMY_HEIGHT; //start right off the screen basically so the cat head goes and pops up at the beginning of the browser and goes down
        this.sprite = images['enemy.png'];

        // Each enemy should have a different speed
        this.speed = Math.random() / 2 + 0.25; //different speeds are made by Math.random()
    }

    update(timeDiff) { //time difference is calculated between one frame and the next frame
        this.y = this.y + timeDiff * this.speed; //timeDiff is = currentFrame - this.lastFrame in gameLoop
    }

}

class Player extends Entity {
    constructor() {
        super();
        this.x = 2 * PLAYER_WIDTH; // set the default position of the burger to be at the middle-ish of the game window
        this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10; //basically set the burger to be 10 pixels above the game height (game window), fairly fixed
        this.sprite = images['player.png'];
        this.health = PLAYER_HEALTH;
    }

    // This method is called by the game engine when left/right arrows are pressed
    move(direction) {
      /* default game direcion instructions */
      //   if (direction === MOVE_LEFT && this.x > 0) { //i.e. only move left if we are left so we dont fall off the screen
      //       this.x = this.x - PLAYER_WIDTH; //i.e. move to next x position by how fat (wide) the burger is
      //   }
      //   else if (direction === MOVE_RIGHT && this.x < GAME_WIDTH - PLAYER_WIDTH) { //i.e. only move right if we we have available space to the right
      //       this.x = this.x + PLAYER_WIDTH; //change the players x position by how wide the burger is
      //   }
      if (direction === MOVE_LEFT) {
         if (this.x === 0){ //i.e. if we are in the leftmost position which at 0 px, 2nd leftmost position is 75 px as we are adding width of burger
            this.x = GAME_WIDTH - PLAYER_WIDTH;
         }
         else if (this.x > 0){ //normal situation
            this.x = this.x - PLAYER_WIDTH;
         }
         // console.log(this.x); //debugging
      }
     else if (direction === MOVE_RIGHT) {
         if ( this.x < GAME_WIDTH - PLAYER_WIDTH ){ //normal situation
            this.x = this.x + PLAYER_WIDTH;
         }
         else if (this.x === (GAME_WIDTH - PLAYER_WIDTH)){ //most rightmost position (dynamic to game width and player width)
            this.x = 0;
         }
         // console.log(this.x) //debugging
     }
    }

}

/*
This section is a tiny game engine.
This engine will use your Enemy and Player classes to create the behavior of the game.
The engine will try to draw your game at 60 frames per second using the requestAnimationFrame function
*/
class Engine {
    constructor(element) {
        // Setup the player
        this.player = new Player();

        // Setup enemies, making sure there are always three
        this.setupEnemies();

        // Setup the <canvas> element where we will be drawing
        var canvas = document.createElement('canvas');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        element.appendChild(canvas);
        element.id = "canvasID";

        this.ctx = canvas.getContext('2d');

        // Since gameLoop will be called out of context, bind it once here.
        this.gameLoop = this.gameLoop.bind(this);
    }

    /*
     The game allows for 5 horizontal slots where an enemy can be present.
     At any point in time there can be at most MAX_ENEMIES enemies otherwise the game would be impossible
     */
    setupEnemies() {
        if (!this.enemies) { //if there are no enemies (more properly, no property enemies), create an array
            this.enemies = [];
        }

        while (this.enemies.filter(e => !!e).length < MAX_ENEMIES ) { //filter our enemies array and return the double negative of the boolean, so we don't have undefined or and then true or false
            this.addEnemy();
        }
    }

    // This method finds a random spot where there is no enemy, and puts one in there
    addEnemy() {
        var enemySpots = GAME_WIDTH / ENEMY_WIDTH; //how many spots are there? it depends on the pixel width of the enemy // 375 / 75 = 5 enemy spots

        var enemySpot;
        // Keep looping until we find a free enemy spot at random
        //while (!enemySpot || this.enemies[enemySpot]) { //while enemyspot is unassigned OR the array enemies spot we made with setupEnemies() is empty (question #1)
        while (!enemySpot && this.enemies[enemySpot]) { //changed || to && as when enemy spot is 0 it stops the loop (recall 0 evaluates as false) therefore
           //when enemySpot is !0 (true) even though this.enemies[0] = 0 (from below expression), it will keep looping until we get another number.
           //We can fix this via && where both (!0 and this.enemies[enemySpot] = 0 ) BOTH need to be true which is impossible in this case, thus it closes the loop
            enemySpot = Math.floor(Math.random() * enemySpots); //assign the enemySpot to either 0, 1, 2, 3, or 4 (i.e. math floor takes it to 0 to 4)
        }

        this.enemies[enemySpot] = new Enemy(enemySpot * ENEMY_WIDTH);
        // in the enemies array element, instantiate a new Enemy with Enemy constructor by passing a free enemy spot (calculated before) + its pixel width
    }

    // This method kicks off the game
    start() { //recall this is a property of the gameEngine class
        this.score = 0;
        this.lastFrame = Date.now(); //we have a property that captures the timestamp of the last frame that had its pixels rendered


        //start myMusic
        myMusic = new sound("gametheme.mp3");
        myMusic.play();

        // Listen for keyboard left/right and update the player
        document.addEventListener('keydown', e => { //?????
            if (e.keyCode === LEFT_ARROW_CODE) {
                this.player.move(MOVE_LEFT); //recall move is a method of the Player class, it only really plays with two arguments, MOVE_LEFT and MOVE_RIGHT
            }
            else if (e.keyCode === RIGHT_ARROW_CODE) {
                this.player.move(MOVE_RIGHT);
            }
        });

        this.gameLoop(); //gameLoop is another method in the Engine class
    }


    /*
    This is the core of the game engine. The `gameLoop` function gets called ~60 times per second
    During each execution of the function, we will update the positions of all game entities
    It's also at this point that we will check for any collisions between the game entities
    Collisions will often indicate either a player death or an enemy kill

    In order to allow the game objects to self-determine their behaviors, gameLoop will call the `update` method of each entity
    To account for the fact that we don't always have 60 frames per second, gameLoop will send a time delta argument to `update`
    You should use this parameter to scale your update appropriately
     */
    gameLoop() {
        // Check how long it's been since last frame
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;

        // Increase the score!
        this.score += timeDiff;

        // Call update on all enemies
        this.enemies.forEach(enemy => enemy.update(timeDiff));// ??

        // Draw everything!
        this.ctx.drawImage(images['stars.png'], 0, 0); // draw the star bg
        this.enemies.forEach(enemy => enemy.render(this.ctx)); // draw the enemies
        this.player.render(this.ctx); // draw the player

        //increase speed of kittens relative t oscore of player
        this.enemies.forEach((enemy, enemyIdx) => {
            enemy.speed += this.score/350000;
         });

        // Check if any enemies should die
        this.enemies.forEach((enemy, enemyIdx) => {
            if (enemy.y > GAME_HEIGHT) { // if a particular cat (at its tail end) is past the particular window frame, 'delete' that particular array item
                delete this.enemies[enemyIdx]; //removes enemies[index] property from the instance
            }
        });
        this.setupEnemies();

        // Check if player is dead
        if (this.isPlayerDead() && this.player.health > 0){
           this.player.health--;
        }
      //if (this.isPlayerDead()) {
        if (this.player.health === 0) {
            // If they are dead, then it's game over!

            myMusic.stop();

            this.player.health = PLAYER_HEALTH;//reset the health
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.score + ' SCORE ', 120, 150);
            this.ctx.fillText(' PRESS SPACE TO RESTART ', 40, 190);

            document.addEventListener('keydown', e =>{
               if (e.keyCode === SPACE_PRESS_CODE){
                  this.score = 0;
                  this.gameLoop();
                  myMusic.play();
               }
            });
        }
        else {
            // If player is not dead, then draw the score
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.score + " score", 5, 30);
            if (this.player.health < 50){
               this.ctx.fillStyle = 'red';
            }
            else {
               this.ctx.fillStyle = 'green';
            }
            this.ctx.fillText(this.player.health + " health", 5, 70);

            // Set the time marker and redraw
            this.lastFrame = Date.now();
            requestAnimationFrame(this.gameLoop);
        }
    }

    isPlayerDead() {
      // PLAYER_HEIGHT is 54px and GAME_HEIGHT is 500px THUS this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10 = 436px (from the top down)
      // The cats are 156px. Thus 156 + 54 = 210. We need accounting for the size of the cat image. Let's make this dynamic by using the HEIGHT vars
      //return false //this was here before my edits
      var playerDeadFlag = false;

      this.enemies.forEach((enemyArrayItem) => {
         // console.log(enemyArrayItem.x + "enemy X");
         // console.log(enemyArrayItem.y + "enemy Y");
         // console.log(Math.floor(enemyArrayItem.y) + "enemy Y FLOORED");
         // console.log(this.player.x   + "player X");
         // console.log(this.player.y + "player Y");
          if ((enemyArrayItem.x === this.player.x) && (enemyArrayItem.y > 0) && (enemyArrayItem.y > (GAME_HEIGHT - (PLAYER_HEIGHT + ENEMY_HEIGHT)))) {
             /* above conditionals verify:
             1) if the burger is at the same cats (this works as they are the both the same width and thus occupy the same X) - i.e. this won't work for different images
             2) if the cat is not off the page and anger the player when s/he correctly dodged the cat
             3) if the cat is at the height in which it will collide with the buger (notice this is dynamic and takes into account the game window and both images height)
             */
            playerDeadFlag = true;
          }
      });

      return playerDeadFlag;

    }
}


// This section will start the game
var gameEngine = new Engine(document.getElementById('app'));
gameEngine.start();
