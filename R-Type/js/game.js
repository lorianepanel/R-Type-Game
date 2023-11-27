let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 320,
    physics: {
        default: 'arcade'
    },
    scene: {
        init: init,
        preload: preload,
        create: create,
        update: update
    },
    audio: {
        disableWebAudio: true
    }
};

const game = new Phaser.Game(config);
let shipSpeed;
let ennemySpeed;
let spacebar;
let missiles;
let missileSpeed;
let speedBulletMultiplier;
let explosionSound;
let numberOfBullets;
let gameState;
let boss;
let bossLives;

function init() {
    shipSpeed = 120;
    ennemySpeed = 80;
    missileSpeed = 300;
    speedBulletMultiplier = 100;
    numberOfBullets = 2;
    gameState = "startScreen";
    bossLives = 50;
}



function preload() {
    this.load.image('player', './assets/images/ship.png');
    this.load.image('ennemy', './assets/images/ennemy.png');
    this.load.image('missile', './assets/images/bullets.png');
    this.load.image('groundEnnemy', './assets/images/groundennemy.png');
    this.load.image('boss', './assets/images/boss.gif');
    this.load.image('bossBall', './assets/images/bossBall.png');
    this.load.image('space', './assets/images/space.png');
    this.load.image('start', './assets/images/start.png');
    this.load.image('rTypeLogo', './assets/images/R-Type_Logo.png');
    this.load.image('bullet', './assets/images/star2.png');
    this.load.spritesheet('explosionAnimation', './assets/animations/explosion.png',
        {
            frameWidth: 128,
            frameHeight: 128
        });
    this.load.audio('explosionSound', './assets/audio/explosion.wav');
    this.load.image('tiles', './assets/images/tiles.png');
    this.load.tilemapTiledJSON('backgroundMap', './assets/tiled/Level2.json');
    this.load.image('gameOver', './assets/images/game_over.png');
}



function create() {

    // TILES
    const map = this.make.tilemap({ key: 'backgroundMap' });
    let sciti = map.addTilesetImage('Sci-Fi', 'tiles', 16, 16, 0, 0);
    let layer = map.createStaticLayer(0, sciti, 0, 0);
    layer.setCollisionBetween(1, 55000);


    // SPACESHIP
    playerShip = this.physics.add.image(50, 160, 'player');

    // ENNEMIES
    ennemy = this.physics.add.image(900, 200, 'ennemy');
    ennemy.setScale(0.5);
    let tweenEnnemy = this.tweens.add({
        targets: ennemy,
        angle: 360,
        duration: 2000,
        ease: 'linear',
        loop: -1,
    });
    groundEnnemy = this.add.image(500, config.height - 92, 'groundEnnemy');

    boss = this.physics.add.image(3050, config.height / 2, 'boss');
    boss.setImmovable(true);
    bossBall = this.physics.add.image(3050, config.height / 2, 'bossBall');
    bossBall.body.enable = true;

    // PROJECTILES
    spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    // réservoir de missiles
    missiles = this.physics.add.group({
        defaultKey: 'missile',
        maxSize: 50
    });
    // réservoirs de bullets
    bullets = this.physics.add.group({
        defaultKey: 'bullet',
        maxSize: numberOfBullets
    });
    bossBullets = this.physics.add.group({
        defaultKey: 'bullet',
        maxSize: 1000
    });

    // animation explosion
    let explosionAnim = this.anims.create({
        key: 'explode',
        frames: this.anims.generateFrameNumbers('explosionAnimation'),
        frameRate: 20,
        repeat: 0,
        hideOnComplete: true
    });
    // son explosion
    explosionSound = this.sound.add('explosionSound');



    // COLLIDERS
    this.physics.add.collider(ennemy, missiles, collisionEnnemyMissile, null, this);
    this.physics.add.collider(playerShip, ennemy, collisionPlayerShipEnnemy, null, this);
    this.physics.add.collider(playerShip, bullets, collisionPlayerShipBullet, null, this);
    this.physics.add.collider(playerShip, layer, collisionPlayerShipLayer, null, this);
    this.physics.add.collider(boss, missiles, collisionBossBallMissile, null, this);

    // LAUNCH
    let backgroundImage = this.add.image(0, 0, 'space');
    backgroundImage.setOrigin(0, 0);
    let logoImage = this.add.image(config.width / 2, 140, 'rTypeLogo');
    let startButton = this.add.image(config.width / 2, 210, 'start').setInteractive();
    startButton.setScale(0.3);
    startButton.on('pointerdown', () => {
        backgroundImage.setVisible(false);
        logoImage.setVisible(false);
        startButton.setVisible(false);
        playerShip.setVelocity(shipSpeed, 0);
        ennemy.setVelocity(-ennemySpeed, 0);
        let timerBulletGroundEnnemy = this.time.addEvent({
            delay: 1000,
            callback: groundEnnemyShootBullet,
            callbackScope: this,
            repeat: numberOfBullets
        });
        gameState = 'scrollGame';
    })

    //GAME OVER SCREEN
    gameOverImage = this.add.image(-1000, 160, 'gameOver');

}



function update() {

    //********************************************************* */
    //STARTSCREEN**********************************************
    //********************************************************* */
    if (gameState === 'startScreen') {

    }

    //********************************************************* */
    //SCROLL GAME *********************************************
    //********************************************************* */
    if (gameState === 'scrollGame') {

        // camera qui scroll automatiquement
        this.cameras.main.scrollX += 1;

        //clavier dirige le vaisseau
        let cursors = this.input.keyboard.createCursorKeys();
        if (cursors.right.isDown) playerShip.setVelocity(shipSpeed, 0);
        if (cursors.left.isDown) playerShip.setVelocity(-shipSpeed, 0);
        if (cursors.up.isDown) playerShip.setVelocity(0, -shipSpeed);
        if (cursors.down.isDown) playerShip.setVelocity(0, shipSpeed);

        // empeche vaisseau de sortir de l'écran
        if (playerShip.x > this.cameras.main.scrollX + config.width) playerShip.x = this.cameras.main.scrollX;
        if (playerShip.x < this.cameras.main.scrollX) playerShip.x = this.cameras.main.scrollX;

        //repositionnement de l'asteroid lorsqu'il sort de l'écran
        if (ennemy.x < this.cameras.main.scrollX) ennemy.setPosition(this.cameras.main.scrollX + config.width + 50, Phaser.Math.Between(120, 200));

        // tir en pressant espace
        if (Phaser.Input.Keyboard.JustDown(spacebar)) {
            let missile = missiles.get();
            if (missile) {
                missile.setPosition(playerShip.x + 17, playerShip.y + 6);
                missile.setVelocity(shipSpeed + missileSpeed, 0);
            }
        }

        // lancement du state boss
        if (this.cameras.main.scrollX >= 2400) {
            let timerFireBossBullet = this.time.addEvent({
                delay: 3000,
                callback: bossShootBullet,
                callbackScope: this,
                repeat: 999
            });
            gameState = "bossGame";
        }
    }




    //********************************************************* */
    //BOSS GAME *********************************************
    //********************************************************* */
    if (gameState === 'bossGame') {


        //clavier dirige le vaisseau
        let cursors = this.input.keyboard.createCursorKeys();
        if (cursors.right.isDown) playerShip.setVelocity(shipSpeed, 0);
        if (cursors.left.isDown) playerShip.setVelocity(-shipSpeed, 0);
        if (cursors.up.isDown) playerShip.setVelocity(0, -shipSpeed);
        if (cursors.down.isDown) playerShip.setVelocity(0, shipSpeed);

        // empeche vaisseau de sortir de l'écran vers la gauche
        if (playerShip.x < this.cameras.main.scrollX) playerShip.x = this.cameras.main.scrollX;

        // tir en pressant espace
        if (Phaser.Input.Keyboard.JustDown(spacebar)) {
            let missile = missiles.get();
            if (missile) {
                missile.setPosition(playerShip.x + 17, playerShip.y + 6);
                missile.setVelocity(shipSpeed + missileSpeed, 0);
            }
        }

        bossBall.body.enable = false;
    }



    //********************************************************* */
    //WIN GAME *********************************************
    //********************************************************* */
    if (gameState === 'winGame') {

    }

    //********************************************************* */
    //GAME OVER *********************************************
    //********************************************************* */
    if (gameState === 'gameOver') {

    }


}




//FONCTIONS EXTERNES


function collisionEnnemyMissile(_ennemy, _missile) {
    let explosionAnim = this.add.sprite(_ennemy.x, _ennemy.y, 'explosionAnimation');
    explosionAnim.play('explode');
    if (gameState == 'scrollGame') {
        _ennemy.setPosition(this.cameras.main.scrollX + config.width + 50, Phaser.Math.Between(120, 200));
        _ennemy.setVelocity(-ennemySpeed, 0);
    }
    else {
        _ennemy.setPosition(1000, 1000);
    }
    _missile.destroy();
    explosionSound.play();
}

function collisionPlayerShipEnnemy(_playerShip, _ennemy) {
    _ennemy.destroy();
    let explosionAnim = this.add.sprite(_playerShip.x, _playerShip.y, 'explosionAnimation');
    explosionAnim.play('explode');
    explosionSound.play();
    gameOver(this);
}

function collisionPlayerShipBullet(_playerShip, _bullet) {
    _bullet.destroy();
    let explosionAnim = this.add.sprite(_playerShip.x, _playerShip.y, 'explosionAnimation');
    explosionAnim.play('explode');
    explosionSound.play();
    gameOver(this);
}

function collisionPlayerShipLayer(_playerShip, _layer) {
    let explosionAnim = this.add.sprite(_playerShip.x, _playerShip.y, 'explosionAnimation');
    explosionAnim.play('explode');
    explosionSound.play();
    gameOver(this);
}


function groundEnnemyShootBullet() {
    let bullet = bullets.get();
    if (bullet) {
        bullet.setPosition(groundEnnemy.x, groundEnnemy.y - 6);
        let shootX = playerShip.x - groundEnnemy.x;
        let shootY = playerShip.y - groundEnnemy.y;
        vectorLength = Math.sqrt(shootX * shootX + shootY * shootY);
        bullet.setVelocity(speedBulletMultiplier * shootX / vectorLength, speedBulletMultiplier * shootY / vectorLength);
    }
}

function bossShootBullet() {
    let y = 105 + 37 * Phaser.Math.Between(0, 3);
    for (let i = 0; i < 10; i++) {
        let bossBullet = bossBullets.get();
        if (bossBullet) {
            bossBullet.setPosition(2980 + i * 3, y);
            bossBullet.setVelocity(-300, 0);
        }
    }

}

function collisionBossBallMissile(_bossBall, _missile) {
    let explosionAnim = this.add.sprite(_bossBall.x, _bossBall.y, 'explosionAnimation');
    explosionAnim.play('explode');
    explosionSound.play();
    _missile.destroy();
    bossLives--;
    if (bossLives <= 0) {
        gameState = 'winGame';
        boss.setVisible(false);
        bossBall.destroy();
        playerShip.setVelocity(shipSpeed, 0);
    }
}


function gameOver(scene) {
    playerShip.setPosition(1000, 1000);
    gameOverImage.setPosition(scene.cameras.main.scrollX + 400, 160);
    gameOverImage.setScale(0.6);
    gameState = 'gameOver';
}