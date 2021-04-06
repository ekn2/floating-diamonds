/*

The Game Project - Final (version 7.3)

*/

var gameChar_x;
var gameChar_y;
var floorPos_y;
var scrollPos;
var gameChar_world_x;

var isLeft;
var isRight;
var isFalling;
var isPlummeting;
var hasJumped;
var isDead;
var hitPlatform_left;
var hitPlatform_right;
var underPlatform;
var isAbovePlatform;

var isGameOver;
var isLevelComplete;
var isNewGame;

var canyons;
var collectables;
var clouds;
var trees;
var trees_x;
var mountains;

var game_score;
var flagpole;
var lives;

const DEBUG = false;
const DEBUG_KEY_PRESSES = false;
const DEBUG_KEY_RELEASES = false;

function setup()
{
	createCanvas( 1024, 576 );
	floorPos_y = height * 3 / 4;
    lives = 3;
    startGame();
}

function draw()
{
    // Reset 'state' variables if this is a new game
    check_newGame();
    
    // Checks and updates 'states' depending on player interaction 
    check_gameMechanics();
    
    // Renders visuals according to current 'states'
    renderVisuals();
    
    // Stops the loop if game is over or level is complete
    check_gameOver();
}

/**
 * Called by p5 every time a key is pressed, handles input from player.
 */
function keyPressed() {

    // LEFT_ARROW, makes gameChar turn left
    if ( keyCode == 37 ) {
        isLeft = true;
    
    // RIGHT_ARROW, makes gameChar turn right
    } else if ( keyCode == 39 ) {
        isRight = true;
    
    // BACKSPACE, makes a new game start when gameChar is dead or level is complete
    } else if ( keyCode == 32 && ( isGameOver || isLevelComplete ) ) {
        isNewGame = true;
        loop();
    
    // BACKSPACE, makes gameChar jump when gameChar is on the floor and flagpole hasn't been reached
    } else if ( keyCode == 32 && !isFalling && !isLevelComplete ) {
        hasJumped = true;
    }
    
    // Logs values to the console if `DEBUG` and `DEBUG_KEY_PRESSES` are set to `true`
    debug_KeyPresses();
}

/**
 * Called by p5 every time a key is released, handles input from player.
 */
function keyReleased() {
    
    // LEFT_ARROW, makes gameChar stop advancing left
    if ( keyCode == 37 ) {
        isLeft = false;
    
    // RIGHT_ARROW, makes gameChar stop advancing right
    } else if ( keyCode == 39 ) {
        isRight = false;
    }
    
    // Logs values to the console if `DEBUG` and `DEBUG_KEY_RELEASES` are set to `true`
    debug_KeyReleases();
}

function Canyon( top_x_pos, top_width ) {
    
    // Top of Canyon
    this.top_width = top_width;
    this.top_left_x_pos = top_x_pos;
    this.top_right_x_pos = this.top_left_x_pos + this.top_width;
    this.top_y_pos = floorPos_y;
    
    // Bottom of Canyon
    this.bottom_left_x_pos  = this.top_left_x_pos - 50;
    this.bottom_right_x_pos = this.top_left_x_pos + this.top_width + 50;
    this.bottom_y_pos = height;
}

function Cloud( x_pos, y_pos, size ) {
    
    // Position and dimensions of Cloud
    this.x_pos = x_pos;
    this.y_pos = y_pos;
    this.height = size;
    
    // Position and dimensions of Base of cloud
    this.base_x_pos = this.x_pos;
    this.base_y_pos = this.y_pos;
    this.ratio_baseHeight_cloudHeight = 3 / 8.5;
    this.base_height = this.height * this.ratio_baseHeight_cloudHeight;
    this.base_width = this.base_height * 4;
    
    // Position and dimensions of Middle of cloud
    this.middle_width = this.base_width / 1.2;
    this.middle_height = this.base_height;
    this.middle_above_base = (this.middle_height / 6) * 5;
    this.middle_x_pos = this.x_pos + ((this.base_width - this.middle_width) / 2);
    this.middle_y_pos = this.base_y_pos - this.middle_above_base;
    
    // Position and dimensions of Top of cloud
    this.top_x_pos = this.x_pos + (this.base_width / 2);
    this.top_y_pos = this.middle_y_pos;
    this.top_height = this.base_height * 2;
}

function DiamondRing( x_pos, y_pos, size ) {
    
    // Found
    this.isFound = false;
    
    // Lengths
    this.height = size;
    this.width = this.height / 1.625;
    
    // Position
    this.left = x_pos;
    this.right = this.left + this.width;
    this.bottom = y_pos;
    this.top = this.bottom - this.height;
    this.center_x = this.left  + ( this.width / 2 );
    this.center_y = this.top + ( this.height / 2 );
    
    // Pentagon Lengths
    this.penta_height = this.width * 0.75;
    this.penta_width_top = this.width / 2;
    this.penta_width_middle = this.width;
    this.penta_x_offset_top = this.width * 0.25;
    
    // Pentagon Vertexes
    this.penta_vertex_top = this.top;
    this.penta_vertex_top_left = this.left + this.penta_x_offset_top;
    this.penta_vertex_top_right = this.penta_vertex_top_left + this.penta_width_top;
    this.penta_vertex_mid = this.top + this.penta_x_offset_top;
    this.penta_vertex_mid_left = this.left;
    this.penta_vertex_mid_right = this.right;
    this.penta_vertex_bottom = this.top + this.penta_height;
    this.penta_vertex_center_x = this.center_x;
    
    // Band Lengths
    this.band_diameter = this.width;
    this.band_thickness = this.band_diameter * 0.125;
    this.band_inner_diameter = this.band_diameter - this.band_thickness;
    this.band_xy_offset = this.band_thickness / 2;
    
    // Band Position
    this.band_left = this.left + this.band_xy_offset;
    this.band_top = this.bottom + this.band_xy_offset - this.band_diameter;
}

function Mountain( x_pos, size ) {
    
    // Position and dimensions of Mountain Range
    this.x_pos = x_pos;
    this.height = size;
    this.base_y_pos = floorPos_y;
    this.summit_y_pos = this.base_y_pos - this.height;
    
    // Position and dimensions of Peak 2 (the highes peak)
    this.ratio_pk2_height_width = 1.16;
    this.pk2_base_width = this.height / this.ratio_pk2_height_width;
    this.pk2_base_left_x_pos = this.x_pos + ( this.pk2_base_width / 4 );
    this.pk2_base_right_x_pos = this.pk2_base_left_x_pos + this.pk2_base_width;
    this.pk2_crest_x_pos = this.pk2_base_left_x_pos + ( this.pk2_base_width / 2 );
    this.pk2_crest_y_pos = this.summit_y_pos;
    
    // Position and dimensions of Peak 1
    this.ratio_pk1_height_width = 0.82;
    this.pk1_base_width = this.pk2_base_width / 2;
    this.pk1_height = this.pk1_base_width * this.ratio_pk1_height_width;
    this.pk1_base_left_x_pos = this.x_pos;
    this.pk1_base_right_x_pos = this.pk1_base_left_x_pos + this.pk1_base_width;
    this.pk1_crest_x_pos = this.pk1_base_left_x_pos + ( this.pk1_base_width / 2 );
    this.pk1_crest_y_pos = this.base_y_pos - this.pk1_height;
    
    // Position and dimensions of Peak 3
    this.ratio_pk3_height_width = 0.66;
    this.pk3_base_width = this.pk2_base_width;
    this.pk3_height = this.pk3_base_width * this.ratio_pk3_height_width;
    this.pk3_base_left_x_pos = this.pk2_base_left_x_pos + ( this.pk2_base_width / 4 ) * 2;
    this.pk3_base_right_x_pos = this.pk3_base_left_x_pos + this.pk3_base_width;
    this.pk3_crest_x_pos = this.pk3_base_left_x_pos + ( this.pk3_base_width / 2 );
    this.pk3_crest_y_pos = this.base_y_pos - this.pk3_height;
}

function Platform( x_pos, y_pos, size ) {
    
    // Length
    this.width = size;
    this.height = 20;
    
    // Position
    this.left = x_pos;
    this.right = this.left + this.width;
    this.top = y_pos;
    this.bottom =  this.top + this.height;
    
    // Color
    this.color_fill = [ 165, 76, 9 ];
}

function Tree( x_pos ) {
    
    // Position and dimensions of Tree
    this.x_pos = x_pos;
    this.base_y_pos = floorPos_y;
    
    // Position and dimensions of Trunk
    this.trunk_width = 30;
    this.trunk_height = 182;
    this.trunk_base_left_x_pos = this.x_pos;
    this.trunk_base_right_x_pos = this.trunk_base_left_x_pos + this.trunk_width
    this.trunk_top_y_pos = this.base_y_pos - this.trunk_height;
    this.trunk_center_x_pos = this.trunk_base_left_x_pos + this.trunk_width / 2;
    
    // Top bush position and dimensions
    this.top_bush_width = 110;
    this.top_bush_offset = -5;
    this.top_bush_center_x_pos = this.trunk_center_x_pos + this.top_bush_offset;
    this.top_bush_center_y_pos = this.trunk_top_y_pos - 60;
    
    // Left bush position and dimensions
    this.left_bush_width = 100;
    this.left_bush_offset = -40;
    this.left_bush_center_x_pos = this.trunk_center_x_pos + this.left_bush_offset;
    this.left_bush_center_y_pos = this.trunk_top_y_pos + 10;
    
    // Right bush position and dimensions
    this.right_bush_width = 150;
    this.right_bush_offset = 30;
    this.right_bush_center_x_pos = this.trunk_center_x_pos + this.right_bush_offset;
    this.right_bush_center_y_pos = this.trunk_top_y_pos + 20;
}

function check_fallingIntoCanyon() {
    if ( !isPlummeting ) {
        for ( var i = 0; i < canyons.length; i++ ) {
            checkCanyon( canyons[ i ] );

            // Stop checking other canyons
            if ( isPlummeting ) {
                break;
            }
        }
    }
}

function check_flagpoleReached() {
    if ( !flagpole.isReached ) {
        checkFlagpole();
    }
}

function check_foundCollectables() {
    for ( var i = 0; i < collectables.length; i++ ) {
        if ( !collectables[ i ].isFound ) {
            checkCollectable( collectables[ i ] );
        }
    }
}

function check_gameCharActions() {
    check_gameCharMoving();
    check_gameCharJumped();
}

function check_gameCharDead() {
    if ( isDead ) {
        lives -= 1;
        
        if ( lives > 0 ) {
            startGame();
        } else {
            isGameOver = true;
        }
    }
}

function check_gameCharFalling() {
    var platform_index = check_platformUnder();
    
    if ( isAbovePlatform ) {
        var platform = platforms[ platform_index ];
        if ( gameChar_y < platform.top ) {
            gameChar_y += 2;
            isFalling = true;
        } else {
            isFalling = false;
        }
    } else if ( gameChar_y < floorPos_y ) {
        gameChar_y += 2;
        isFalling = true;
    } else {
        isFalling = false;
    }
}

function check_gameCharJumped() {
    if ( hasJumped ) {
        var gameChar_left = gameChar_world_x - 8;
        var gameChar_right = gameChar_world_x + 8;
        var gameChar_top = gameChar_y - 62;
        var gameChar_bottom = gameChar_y;
        
        var platform = platforms[ check_platformAbove() ];
        
        if ( underPlatform ) {
            
            var length = gameChar_top - platform.bottom;
            
            if ( length <= 50 ) {
                length = length;
            } else {
                length = 100;
            }
            
            gameChar_y -= length;
            
            hasJumped = false;
        } else {

            gameChar_y -= 100;

            // Restore state to false
            hasJumped = false;
            }
    }
}

function check_gameCharMoving() {
    if ( isLeft && !hitPlatform_right ) {
		if ( gameChar_x > width * 0.2 ) {
			gameChar_x -= 5;
		} else {
			scrollPos += 5;
		}
	}
	
    if ( isRight && !hitPlatform_left ) {
		if ( gameChar_x < width * 0.8 ) {
			gameChar_x += 5;
		} else {
			scrollPos -= 5;
		}
	}
    
    // Update gameChar x position in the game world
    gameChar_world_x = gameChar_x - scrollPos;
}

function check_gameCharPlummeting() {
    if ( isPlummeting ) {
        checkPlayerDie();
        
        // Accelerate falling and check if gameChar is dead
        if ( !isDead ) {
            gameChar_y += 20;
        }
    }
}

function check_gameCharReactions() {
    check_gameCharFalling();
    check_gameCharPlummeting();
    check_gameCharDead();
    check_platformHit( platforms );
}

function check_gameMechanics() {
    check_gameCharActions();
    check_gameWorldHazards();
    check_playerAchievements();
    check_gameCharReactions();
}

function check_gameOver() {
    if ( isGameOver || isLevelComplete ) {
        noLoop();
    }
}

function check_gameWorldHazards() {
    check_fallingIntoCanyon();
}

function check_platformHit( platforms ) {
    for ( var i = 0; i < platforms.length; i++ ) {
        var platform = platforms[ i ];

        // gameChar position
        var gameChar_left = gameChar_world_x - 8;
        var gameChar_right = gameChar_world_x + 8;
        var gameChar_top = gameChar_y - 62;
        var gameChar_bottom = gameChar_y;

        if ( gameChar_right >= platform.left && platform.left > gameChar_left && gameChar_top < platform.bottom && gameChar_bottom > platform.top ) {
            
            hitPlatform_left = true;
            hitPlatform_right = false;
            console.log( hitPlatform_left + " " + i );
            break;
        } if ( gameChar_left <= platform.right && platform.right < gameChar_right && gameChar_top < platform.bottom && gameChar_bottom > platform.top ) {
            
            hitPlatform_right = true;
            hitPlatform_left = false;
            console.log( hitPlatform_right +  " " + i );
            break;
        } else {
            
            hitPlatform_left = false;
            hitPlatform_right = false;
        }
    }
}

function check_platformAbove() {
    for ( var i = 0; i < platforms.length; i++ ) {
        var platform = platforms[ i ];
        
        // gameChar position
        var gameChar_left = gameChar_world_x - 8;
        var gameChar_right = gameChar_world_x + 8;
        var gameChar_top = gameChar_y - 62;
        var gameChar_bottom = gameChar_y;
        
        if ( ( ( gameChar_right > platform.left && gameChar_left < platform.right ) || 
            ( gameChar_right > platform.right && gameChar_left < platform.right ) ) &&
            ( gameChar_top > platform.bottom ) ) {
            
            underPlatform = true;
            return i;
        }
    }
    
    underPlatform = false;
    return null;
}

function check_platformUnder() {
    for ( var i = 0; i < platforms.length; i++ ) {
        var platform = platforms[ i ];
        
        // gameChar position
        var gameChar_left = gameChar_world_x - 8;
        var gameChar_right = gameChar_world_x + 8;
        var gameChar_top = gameChar_y - 62;
        var gameChar_bottom = gameChar_y;
        
        if ( ( ( gameChar_right > platform.left && gameChar_left < platform.right ) || 
            ( gameChar_right > platform.right && gameChar_left < platform.right ) ) &&
            ( gameChar_bottom <= platform.top ) ) {
            
            isAbovePlatform = true;
            console.log( "isAbovePlatform" );
            return i;
        }
    }
    
    isAbovePlatform = false;
    return null;
}

function check_newGame() {
    if ( isNewGame ) {
        lives = 3;
        startGame();
    }
}

function check_playerAchievements() {
    check_foundCollectables();
    check_flagpoleReached();
}

// Sets `isPlummeting` var to `true` or `false` depending on wether gameChar is falling into a canyon or not.
function checkCanyon( t_canyon ) {
    
    // Is gameChar between the open space of a canyon? AND... Is gameChar at ground level?
    if ( ( gameChar_world_x > t_canyon.top_left_x_pos && gameChar_world_x < t_canyon.top_right_x_pos ) &&
        gameChar_y >= floorPos_y ) {
        
        // If true, then it's plummeting.
        isPlummeting = true;
        
    // Otherwise it's not.
    } else {
        isPlummeting = false;
    }
}

function checkCollectable( t_collectable ) {

    // gameChar
    var a = gameChar_world_x - 8;
    var b = gameChar_world_x + 8;
    var c = gameChar_y - 62;
    var d = gameChar_y;
    
    // collectable
    var A = t_collectable.left;
    var B = t_collectable.left + t_collectable.width;
    var C = t_collectable.bottom - t_collectable.height;
    var D = t_collectable.bottom;
    
    if ( ( ( B > b && b > A ) || ( B > a && a > A ) ) &&
        ( ( C <= d && d <= D ) || ( C <= c && c <= D ) || ( C > c && D < d ) ) ) {
        t_collectable.isFound = true;
        game_score += 1;
    }
}

function checkFlagpole() {
    var d = abs( gameChar_world_x - flagpole.x_pos );
    
    if ( d < 15 ) {
        flagpole.isReached = true;
        isLevelComplete = true;
    }
}

function checkPlayerDie() {
    //console.log( gameChar_y );
    
    if ( gameChar_y > height ) {
        isDead = true;
    }
}

/**
 * Logs key presses and other values to the console every time a key is pressed when
 * `DEBUG` and `DEBUG_KEY_PRESSES` are set to `true`
 */
function debug_KeyPresses() {
    if ( DEBUG && DEBUG_KEY_PRESSES ) {
        console.log( "press" + keyCode );
        console.log( "press" + key );
        console.log( "isLeft (press): " + isLeft );
        console.log( "isRight (press): " + isRight );
        console.log( "gameChar_x (press): " + gameChar_x );
        console.log( "gameChar_world_x (press): " + gameChar_world_x );
    }
}

/**
 * Logs key releases and other values to the console every time a key is released when
 * `DEBUG` and `DEBUG_KEY_RELEASES` are set to `true`
 */
function debug_KeyReleases() {
    if ( DEBUG && DEBUG_KEY_RELEASES ) {
        console.log( "release" + keyCode );
        console.log( "release" + key );
        console.log( "isLeft (release): " + isLeft );
        console.log( "isRight (release): " + isRight );
        console.log( "gameChar_x (release): " + gameChar_x );
        console.log( "gameChar_world_x (release): " + gameChar_world_x );
    }
}

function drawBackground() {
    background( 100, 155, 255 );
}

function drawCanyons( canyons ) {
    for ( var i = 0; i < canyons.length; i++ ) {
        
        // Style
        noStroke();
        
        // Same color as background
        fill( 100, 155, 255 );
        
        // Shape of canyon
        quad(
            canyons[ i ].top_left_x_pos, canyons[ i ].top_y_pos,
            canyons[ i ].top_right_x_pos, canyons[ i ].top_y_pos,
            canyons[ i ].bottom_right_x_pos, canyons[ i ].bottom_y_pos,
            canyons[ i ].bottom_left_x_pos, canyons[ i ].bottom_y_pos
        );
    }
}

function drawClouds( clouds ) {
    for ( var i = 0; i < clouds.length; i++ ) {
        
        // Color and style
        noStroke();
        fill( 255 );
        
        // Top of cloud
        ellipse(
            clouds[ i ].top_x_pos,
            clouds[ i ].top_y_pos,
            clouds[ i ].top_height
        );
        
        // Middle of cloud
        rect(
            clouds[ i ].middle_x_pos,
            clouds[ i ].middle_y_pos,
            clouds[ i ].middle_width,
            clouds[ i ].middle_height,
            20
        );
        
        // Base of cloud
        rect(
            clouds[ i ].base_x_pos,
            clouds[ i ].base_y_pos,
            clouds[ i ].base_width,
            clouds[ i ].base_height,
            20
        );
    }
}

function drawCollectables( collectables ) {
    for ( var i = 0; i < collectables.length; i++ ) {
        var ring = collectables[ i ];
        
        if ( !ring.isFound ) {            
            // Band
            noFill();
            stroke( 218, 165, 32 );
            strokeWeight( ring.band_thickness );
            rect(
                ring.band_left,
                ring.band_top,
                ring.band_inner_diameter,
                ring.band_inner_diameter,
                ring.band_inner_diameter
            );

            // Stone
            noStroke();
            fill( 186, 85, 211 );
            beginShape();
                vertex( ring.penta_vertex_mid_left, ring.penta_vertex_mid );
                vertex( ring.penta_vertex_top_left, ring.penta_vertex_top );
                vertex( ring.penta_vertex_top_right, ring.penta_vertex_top );
                vertex( ring.penta_vertex_mid_right, ring.penta_vertex_mid );
                vertex( ring.penta_vertex_center_x, ring.penta_vertex_bottom );
            endShape();
        }
    }
}

function drawDisplaceables() {
    push();
    
    // Displaces all scenery elements drawn between it and pop().
    // `scrollPos` determines how many pixels these elements are being displaced to the left or to the right.
    // So if `cloud[ i ].x_pos = 100` and `scrollPos = 5`, then `cloud[ i ]` will be displayed at 105, but
    // `cloud[ i ].x_pos` will still be 100. It only affects elements visually, it doesn't change their poisition values.
    translate( scrollPos, 0 );
    
    // Clouds
    drawClouds( clouds );
    
    // Mountains
    drawMountains( mountains );
    
    // Trees
    drawTrees( trees );
    
    // Canyons
    drawCanyons( canyons );
    
    // Platforms
    drawPlatforms( platforms );
    //draw_platform();
    
    // Collectables
    drawCollectables( collectables );
    
    // Flagpole (it's displaceable because it's out of frame in the beginning)
    renderFlagpole();
    
    pop();
}

function drawFloor() {
    noStroke();
	fill( 0, 155, 0 );
	rect(
        0,
        floorPos_y,
        width,
        height / 4
    );
}

function drawGameChar() {
	if ( isLeft && isFalling ) {
        fill( 255, 182, 193 );  
        rect( gameChar_x - 8, gameChar_y - 62, 16, 20);     
        ellipse( gameChar_x - 10, gameChar_y - 52, 10, 6 );  
        rect( gameChar_x - 24, gameChar_y - 42, 48, 6 );     
        fill( 0 );            
        rect( gameChar_x - 8, gameChar_y - 62, 16, 6 );      

        fill( 255, 69, 0 );
        rect( gameChar_x - 8, gameChar_y - 42, 16, 22 );  
        rect( gameChar_x - 18, gameChar_y - 42, 36, 6 );   

        fill( 139, 69, 19 );   
        rect( gameChar_x - 24, gameChar_y - 22, 48, 10 );  
        fill( 210, 105, 30 );  
        rect( gameChar_x - 18, gameChar_y - 22, 36, 10 );  
	
    } else if ( isRight && isFalling ) {
        fill( 255, 182, 193 );
        rect( gameChar_x - 8, gameChar_y - 62, 16, 20 );
        ellipse( gameChar_x + 10, gameChar_y - 52, 10, 6 );
        rect( gameChar_x - 24, gameChar_y - 42, 48, 6 );  
        fill( 0 );
        rect( gameChar_x - 8, gameChar_y - 62, 16, 6 );     

        fill( 255, 69, 0 );
        rect( gameChar_x - 8, gameChar_y - 42, 16, 22 );  
        rect( gameChar_x - 18, gameChar_y - 42, 36, 6 );  

        fill( 139, 69, 19 );
        rect( gameChar_x - 24, gameChar_y - 22, 48, 10 );
        fill( 210, 105, 30 );
        rect( gameChar_x - 18, gameChar_y - 22, 36, 10 );

	} else if ( isLeft ) {
        fill( 255, 182, 193 );  
        rect( gameChar_x - 8, gameChar_y - 70, 16, 20 );     
        ellipse( gameChar_x - 10, gameChar_y - 60, 10, 6 );  
        fill( 0 );
        rect( gameChar_x - 8, gameChar_y - 70, 16, 6 );      

        fill( 255, 69, 0 );
        rect( gameChar_x - 8, gameChar_y - 50, 16, 22 );     
    
        fill( 210, 105, 30 );
        rect( gameChar_x - 8, gameChar_y - 28, 16, 22 );  
        fill( 255, 182, 193 );
        rect( gameChar_x - 3, gameChar_y - 28, 6, 6 );    
        fill( 139, 69, 19 );
        rect( gameChar_x - 6, gameChar_y - 6, 12, 6 );    

	} else if ( isRight ) {
        fill( 255, 182, 193 );  
        rect( gameChar_x - 8, gameChar_y - 70, 16, 20 );     
        ellipse( gameChar_x + 10, gameChar_y - 60, 10, 6 );  
        fill( 0 );
        rect( gameChar_x - 8, gameChar_y - 70, 16, 6 );      

        /** Torso (Walking, turned right) **/
        fill( 255, 69, 0 );
        rect( gameChar_x - 8, gameChar_y - 50, 16, 22 );     

        /** Legs and Hand (Walking, turned right) **/
        fill( 210, 105, 30 );
        rect( gameChar_x - 8, gameChar_y - 28, 16, 22 );  
        fill( 255, 182, 193 );
        rect( gameChar_x - 3, gameChar_y - 28, 6, 6 );   
        fill( 139, 69, 19);
        rect( gameChar_x - 6, gameChar_y - 6, 12, 6 );
        
	} else if ( isFalling || isPlummeting ) {
        /** Head and Arms (Jumping facing forwards) **/
        fill( 255, 182, 193 );  
        rect( gameChar_x - 10, gameChar_y - 62, 20, 20 );  
        rect( gameChar_x - 24, gameChar_y - 42, 48, 6 );   
        fill( 0 );            
        rect( gameChar_x - 10, gameChar_y - 62, 20, 6 );   

        /** Torso (Jumping facing forwards) **/
        fill( 255, 69, 0 );  
        rect( gameChar_x - 10, gameChar_y - 42, 20, 22 );  
        rect( gameChar_x - 18, gameChar_y - 42, 36, 6 );   

        /** Legs (Jumping facing forwards) **/
        fill( 139, 69, 19 );
        rect( gameChar_x - 24, gameChar_y - 22, 48, 10 );  
        fill( 210, 105, 30 );
        rect( gameChar_x - 18, gameChar_y - 22, 36, 10 );  

	} else {   
        /** Head and Hands (Standing, facing frontwards) **/
        fill( 255, 182, 193 );  
        rect( gameChar_x - 10, gameChar_y - 70, 20, 20 );  
        rect( gameChar_x - 16, gameChar_y - 28, 32, 6 );
        fill( 0 );
        rect( gameChar_x - 10, gameChar_y - 70, 20, 6 );   
    
        /** Torso (Standing, facing frontwards) **/
        fill( 255, 69, 0 );
        rect( gameChar_x - 16, gameChar_y - 50, 32, 22 );
   
        /** Legs (Standing, facing frontwards) **/
        fill( 210, 105, 30 );
        rect( gameChar_x - 10, gameChar_y - 28, 20, 22 );  
        fill( 139, 69, 19 );
        rect( gameChar_x - 8, gameChar_y - 6, 16, 6 );     
	}
}

function drawGameChar_front() {
    
    // Skin color
    fill( gameChar.color_skin );

    // Head
    rect(
        gameChar.head_left_front,
        gameChar.head_top_front,
        gameChar.head_width_front,
        gameChar.head_height_front
    );

    // Hands
    rect(
        gameChar.hands_left_front,
        gameChar.hands_top_front,
        gameChar.hands_width_front,
        gameChar.hands_height_front
    );

    // Hair
    fill( gameChar.color_hair );
    rect(
        gameChar.hair_left_front,
        gameChar.hair_top_front,
        gameChar.hair_width_front,
        gameChar.hair_height_front
    );   

    // Torso and arms
    fill( gameChar.color_shirt );
    rect(
        gameChar.torso_left_front,
        gameChar.torso_top_front,
        gameChar.torso_width_front,
        gameChar.torso_height_front );

    // Legs and feet
    fill( gameChar.color_pants );
    rect(
        gameChar.legs_left_front,
        gameChar.legs_top_front,
        gameChar.legs_width_front,
        gameChar.legs_height_front
    ); 
    fill( gameChar.color_shoe );
    rect(
        gameChar.feet_left_front,
        gameChar.feet_top_front,
        gameChar.feet_width_front,
        gameChar.feet_height_front
    ); 
}

function drawGameChar_side() {
    
}

function drawMountains( mountains ) {
    for ( var i = 0; i < mountains.length; i++ ) {
        
        // General style of mountain range
        noStroke();
        
        // Peak 3 of mountain range
        fill( 190 );
        triangle(
            mountains[ i ].pk3_base_left_x_pos, mountains[ i ].base_y_pos,
            mountains[ i ].pk3_base_right_x_pos, mountains[ i ].base_y_pos,
            mountains[ i ].pk3_crest_x_pos, mountains[ i ].pk3_crest_y_pos
        );
        
        // Peak 2 of mountain range
        fill( 200 );
        triangle(
            mountains[ i ].pk2_base_left_x_pos, mountains[ i ].base_y_pos,
            mountains[ i ].pk2_base_right_x_pos, mountains[ i ].base_y_pos,
            mountains[ i ].pk2_crest_x_pos, mountains[ i ].pk2_crest_y_pos
        );
        
        // Peak 1 of mountain range
        fill( 210 );
        triangle(
            mountains[ i ].pk1_base_left_x_pos, mountains[ i ].base_y_pos,
            mountains[ i ].pk1_base_right_x_pos, mountains[ i ].base_y_pos,
            mountains[ i ].pk1_crest_x_pos, mountains[ i ].pk1_crest_y_pos
        );
    }
}

function drawPlatforms( platforms ) {
    for ( var i = 0; i < platforms.length; i++ ) {
        var platform = platforms[ i ];
        var color_fill = platform.color_fill;
        
        fill.apply( this, color_fill );
        noStroke();
        rect(
            platform.left,
            platform.top,
            platform.width,
            platform.height
        );
    }
}

function draw_platform() {
    noFill();
    stroke( 0 );
    strokeWeight( 1 );
    rect(
        300,
        floorPos_y - 100,
        100,
        100
    );
}

function drawScoreboard() {
    fill( 0, 0, 0 );
    textAlign( LEFT );
    textSize( 16 );
    text( "score: " + game_score, 20, 20 );
    textAlign( CENTER );
    text( "lives: " + lives, width / 2, 20 );
}

function drawTrees( trees ) {
    for ( var i = 0; i < trees.length; i++ ) {
        
        // Trunk
        fill( 160, 82, 45 );
        triangle(
            trees[ i ].trunk_base_left_x_pos, trees[ i ].base_y_pos,
            trees[ i ].trunk_base_right_x_pos, trees[ i ].base_y_pos,
            trees[ i ].trunk_center_x_pos, trees[ i ].trunk_top_y_pos
        );
        
        // Bushes color
        fill( 0, 155, 0 );
        
        // Top bush
        ellipse(
            trees[ i ].top_bush_center_x_pos,
            trees[ i ].top_bush_center_y_pos,
            trees[ i ].top_bush_width
        );
        
        // Left Bush
        ellipse(
            trees[ i ].left_bush_center_x_pos,
            trees[ i ].left_bush_center_y_pos,
            trees[ i ].left_bush_width
        );
        
        // Right Bush
        ellipse(
            trees[ i ].right_bush_center_x_pos,
            trees[ i ].right_bush_center_y_pos,
            trees[ i ].right_bush_width
        );
    }
}

function renderFlagpole() {
    strokeWeight( 5 );
    stroke( 0 );
    line( flagpole.x_pos, floorPos_y, flagpole.x_pos, floorPos_y - 250 );
    noStroke();
    fill( 255, 126, 0 );
    
    if ( flagpole.isReached ) {
        rect( flagpole.x_pos, floorPos_y - 250, 80, 50 );
    
    } else {
        rect( flagpole.x_pos, floorPos_y - 50, 80, 50 );
    }
}

function renderVisuals() {
    drawBackground();
    drawFloor();
    drawDisplaceables();
    drawGameChar();
    drawScoreboard();
    show_levelCompleteMessage();
    show_gameOverMessage();
}

function startGame() {
    isDead = false;
    isGameOver = false;
    isLevelComplete = false;
    isNewGame = false;
    
    // Character Position
	gameChar_x = 100;
	gameChar_y = floorPos_y;
	scrollPos = 0;
	gameChar_world_x = gameChar_x - scrollPos;
    
    // Character Actions
	isLeft = false;
	isRight = false;
	isFalling = false;
	isPlummeting = false;
    hitPlatform_left = false;
    hitPlatform_right = false;
    underPlatform = false;
    isAbovePlatform = false;
    
    // Scenery Elements
    trees = [];
    trees_x = [
        200,
        1200,
        2700,
        3700,
        5600,
        6800,
    ];
    
    for ( var i = 0; i < trees_x.length; i++ ) {
        trees.push( new Tree( trees_x[ i ] ) );
    }
    
    clouds = [
        new Cloud( 300, 150, 85 ),
        new Cloud( 900, 100, 120 ),
        new Cloud( 1500, 50, 85 ),
        new Cloud( 3300, 180, 130 )
    ];
    
    mountains = [
        new Mountain( 800, 150 ),
        new Mountain( 2300, 180 ),
        new Mountain( 4350, 150),
        new Mountain( 6200, 180),
    ];
    
    canyons = [
        
        // 1st stage
        new Canyon( 500, 100 ),
        new Canyon( 1500, 400),
        new Canyon( 3000, 200 ),
        
        new Canyon( 5000, 300 ),
        
        new Canyon( 7300, 600 ),
        
        new Canyon( 8000, 1000 ),
    ];
    
    collectables = [
        // 1st stage
        new DiamondRing( 530, floorPos_y - 80, 40 ),
        new DiamondRing( 2000, floorPos_y - 30, 40 ),
        
        
        // 2nd Stage
        new DiamondRing( 3600, floorPos_y, 65 ),
        new DiamondRing( 3900, floorPos_y - 300, 50),
        
        
        new DiamondRing( 4560, floorPos_y - 200, 40),
        
        new DiamondRing( 5120, floorPos_y - 150, 65 ),
        new DiamondRing( 5700, floorPos_y - 280, 30),
        new DiamondRing( 5900, floorPos_y - 180, 30),
        new DiamondRing( 6000, floorPos_y - 220, 30),
        
        new DiamondRing( 7900, floorPos_y - 250, 40),
    ];
    
    platforms = [
        new Platform( 1600, floorPos_y - 50, 50 ),
        
        new Platform( 3950, floorPos_y - 50, 50),
        new Platform( 4050, floorPos_y - 100, 50),
        new Platform( 4100, floorPos_y - 150, 50),
        new Platform( 4150, floorPos_y - 200, 50),
        new Platform( 4000, floorPos_y - 250, 50),
        
        new Platform( 4550, floorPos_y - 200, 40),
        new Platform( 4600, floorPos_y - 300, 600),
        new Platform( 5300, floorPos_y - 170, 50),
        new Platform( 5380, floorPos_y - 250, 30),
        new Platform( 5415, floorPos_y - 290, 15),
        new Platform( 5950, floorPos_y - 180, 30),
        new Platform( 5200, floorPos_y - 130, 20),
        new Platform( 5100, floorPos_y - 50, 100),
        
        new Platform( 7350, floorPos_y - 50, 50),
        new Platform( 7500, floorPos_y - 100, 20),
        new Platform( 7650, floorPos_y - 150, 20),
        new Platform( 7800, floorPos_y - 200, 20),
        
        new Platform( 8150, floorPos_y - 40, 30 ),
        new Platform( 8350, floorPos_y - 40, 30 ),
        new Platform( 8500, floorPos_y - 40, 30 ),
        new Platform( 8700, floorPos_y - 40, 30 ),
        new Platform( 8850, floorPos_y - 40, 30 ),
    ];
    
    // Score
    game_score = 0;
    
    flagpole = {
        x_pos: 9500,
        isReached: false
    };
}

function show_gameOverMessage() {
    if ( isGameOver ) {
        textAlign( CENTER, CENTER );
        text( "Game over. Press space to continue.", width / 2, height / 2 );
        console.log("lives: " + lives);
    }
}

function show_levelCompleteMessage() {
    if ( flagpole.isReached ) {
        textAlign( CENTER, CENTER );
        text( "Level complete. Press space to continue.", width / 2, height / 2 );
    }
}