import Phaser from 'phaser';

class Hero extends Phaser.GameObjects.Sprite {

  constructor(scene, x, y) {
    super(scene, x, y, 'hero-run-sheet', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.anims.play('hero-running');
    this.body.setCollideWorldBounds(true);
    this.body.setSize(12, 40);
    this.body.setOffset(12, 23);

    this.body.setMaxVelocity(110, 440);
    this.body.setDragX(750);
    this.keys = scene.cursorKeys;
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (this.keys.left.isDown) {
      this.body.setAccelerationX(-440);
      this.setFlipX(true);
      this.body.offset.x = 8;
    } else if (this.keys.right.isDown) {
      this.body.setAccelerationX(440);
      this.setFlipX(false);
      this.body.offset.x = 12;
    } else {
      this.body.setAccelerationX(0);
    }

    const didPressJump = Phaser.Input.Keyboard.JustDown(this.keys.up);
    
    if (didPressJump) {
      if(this.body.onFloor()){
        this.body.setVelocityY(-440);
        this.canDoubleJump = true;
      } else if (this.canDoubleJump) {
        this.canDoubleJump = false;
        this.body.setVelocityY(-310);
      }
    }

    if(!this.keys.up.isDown && this.body.velocity.y < -150) {
      this.body.setVelocityY(-150);
    }
  }
}

export default Hero;