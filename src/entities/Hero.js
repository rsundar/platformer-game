import Phaser from 'phaser';
import StateMachine from 'javascript-state-machine';

class Hero extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'hero-run-sheet', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.anims.play('hero-running');

    this.setOrigin(0.5, 1);
    this.body.setCollideWorldBounds(true);
    this.body.setSize(12, 40);
    this.body.setOffset(12, 23);

    this.body.setMaxVelocity(110, 440);
    this.body.setDragX(750);
    this.keys = scene.cursorKeys;

    this.setupMovement();
    this.setupAnimations();

    this.input = {};
  }

  setupAnimations() {
    this.animState = new StateMachine({
      init: 'idle',
      transitions: [
        { name: 'idle', from: ['running', 'falling', 'pivoting'], to: 'idle' },
        { name: 'run', from: ['falling', 'idle', 'pivoting'], to: 'running' },
        { name: 'pivot', from: ['falling', 'running'], to: 'pivoting' },
        { name: 'jump', from: ['idle', 'running', 'pivoting'], to: 'jumping' },
        { name: 'flip', from: ['jumping', 'falling'], to: 'flipping' },
        { name: 'fall', from: '*', to: 'falling' },
      ],
      methods: {
        onEnterState: (lifecycle) => {
          // eslint-disable-next-line prefer-template
          this.anims.play('hero-' + lifecycle.to);
        },
      },
    });

    this.animPredicates = {
      idle: () => this.body.onFloor() && this.body.velocity.x === 0,
      run: () => this.body.onFloor() && Math.sign(this.body.velocity.x) === (this.flipX ? -1 : 1),
      pivot: () => this.body.onFloor() && Math.sign(this.body.velocity.x) === (this.flipX ? 1 : -1),
      jump: () => this.body.velocity.y < 0,
      flip: () => this.body.velocity.y < 0 && this.moveState.is('flipping'),
      fall: () => this.body.velocity.y > 0,
    };
  }

  setupMovement() {
    this.moveState = new StateMachine({
      init: 'standing',
      transitions: [
        { name: 'jump', from: 'standing', to: 'jumping' },
        { name: 'flip', from: 'jumping', to: 'flipping' },
        { name: 'fall', from: 'standing', to: 'falling' },
        { name: 'touchdown', from: ['jumping', 'flipping', 'falling'], to: 'standing' },
      ],
      methods: {
        onJump: () => {
          this.body.setVelocityY(-440);
        },
        onFlip: () => {
          this.body.setVelocityY(-330);
        },
      },
    });

    this.movePredicates = {
      jump: () => this.input.didPressJump,
      fall: () => !this.body.onFloor(),
      flip: () => this.input.didPressJump,
      touchdown: () => this.body.onFloor(),
    };
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    this.input.didPressJump = Phaser.Input.Keyboard.JustDown(this.keys.up);

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

    if (this.moveState.is('jumping') || this.moveState.is('flipping')) {
      if (!this.keys.up.isDown && this.body.velocity.y < -150) {
        this.body.setVelocityY(-150);
      }
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const t of this.moveState.transitions()) {
      if (t in this.movePredicates && this.movePredicates[t]()) {
        this.moveState[t]();
        break;
      }
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const t of this.animState.transitions()) {
      if (t in this.animPredicates && this.animPredicates[t]()) {
        this.animState[t]();
        break;
      }
    }
  }
}

export default Hero;