import Phaser from 'phaser'

import {
  advanceRace,
  centeredBoundsOverlap,
  clampCarX,
  collectibleY,
  isRaceFinished,
} from './gameplay'

const WIDTH = 1024
const HEIGHT = 768
const ROAD_LEFT = 260
const ROAD_RIGHT = 764
const ROAD_CENTER = (ROAD_LEFT + ROAD_RIGHT) / 2
const CAR_Y = 620
const CAR_HALF_WIDTH = 65
const CAR_HALF_HEIGHT = 88
const COLLECTIBLE_RADIUS = 28
const COLLECTIBLE_START_Y = -50
const COLLECTIBLE_END_Y = HEIGHT + 50
const COLLECTIBLE_TRAVEL_PROGRESS = 0.3
const COLLECTIBLE_SCORE = 10
const RACE_DURATION_MS = 12_000
const ROAD_SPEED = 420
const DASH_SPACING = 180

const COLORS = {
  sky: 0x38bdf8,
  grass: 0x65c466,
  asphalt: 0x404858,
  white: 0xfff8e7,
  red: 0xf04444,
  yellow: 0xffd43b,
  navy: 0x18243b,
  black: 0x17191f,
}

const COLLECTIBLE_LAYOUT = [
  { x: ROAD_CENTER - 140, spawnProgress: 0.02 },
  { x: ROAD_CENTER + 140, spawnProgress: 0.14 },
  { x: ROAD_CENTER, spawnProgress: 0.26 },
  { x: ROAD_CENTER + 140, spawnProgress: 0.38 },
  { x: ROAD_CENTER - 140, spawnProgress: 0.5 },
  { x: ROAD_CENTER, spawnProgress: 0.62 },
] as const

interface Collectible {
  x: number
  spawnProgress: number
  sprite: Phaser.GameObjects.Star
  collected: boolean
}

type RaceState = 'racing' | 'finished'

export class RaceScene extends Phaser.Scene {
  private state: RaceState = 'racing'
  private progress = 0
  private car!: Phaser.GameObjects.Container
  private score = 0
  private scoreText!: Phaser.GameObjects.Text
  private collectibles: Collectible[] = []
  private laneDashes: Phaser.GameObjects.Rectangle[] = []
  private finishLine!: Phaser.GameObjects.Container
  private finishOverlay!: Phaser.GameObjects.Container

  constructor() {
    super('race')
  }

  create(): void {
    this.drawBackyard()
    this.drawRoad()
    this.createLaneDashes()
    this.createCollectibles()
    this.finishLine = this.createFinishLine()
    this.car = this.createCar()
    this.scoreText = this.createScoreCounter()
    this.finishOverlay = this.createFinishOverlay()

    this.input.on('pointerdown', this.steerCar, this)
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) this.steerCar(pointer)
    })

    this.resetRace()
  }

  update(_time: number, delta: number): void {
    if (this.state !== 'racing') return

    const safeDelta = Math.min(delta, 50)
    this.progress = advanceRace(this.progress, delta, RACE_DURATION_MS)
    this.moveRoad(safeDelta)
    this.positionFinishLine()
    this.updateCollectibles()

    if (isRaceFinished(this.progress)) this.finishRace()
  }

  private drawBackyard(): void {
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, COLORS.grass)
    this.add.rectangle(WIDTH / 2, 54, WIDTH, 108, COLORS.sky)

    this.add.circle(80, 50, 27, COLORS.yellow)
    this.add.circle(164, 48, 20, COLORS.white)
    this.add.circle(188, 40, 26, COLORS.white)
    this.add.circle(216, 50, 19, COLORS.white)
    this.add.circle(840, 54, 18, COLORS.white)
    this.add.circle(865, 43, 27, COLORS.white)
    this.add.circle(895, 54, 18, COLORS.white)

    this.drawTree(112, 218)
    this.drawTree(900, 238)
    this.drawFlowers(132, 470)
    this.drawFlowers(884, 510)
  }

  private drawTree(x: number, y: number): void {
    this.add.rectangle(x, y + 52, 24, 92, 0x93633f)
    this.add.circle(x - 28, y, 39, 0x2f9851)
    this.add.circle(x + 28, y + 2, 42, 0x2f9851)
    this.add.circle(x, y - 28, 48, 0x38aa59)
  }

  private drawFlowers(startX: number, y: number): void {
    const colors = [COLORS.yellow, COLORS.red, COLORS.white]
    for (let index = 0; index < 3; index += 1) {
      const x = startX + index * 38
      this.add.rectangle(x, y + 16, 5, 32, 0x278743)
      this.add.circle(x, y, 10, colors[index])
      this.add.circle(x, y, 4, COLORS.navy)
    }
  }

  private drawRoad(): void {
    this.add.rectangle(
      ROAD_CENTER,
      HEIGHT / 2 + 54,
      ROAD_RIGHT - ROAD_LEFT,
      HEIGHT - 108,
      COLORS.asphalt,
    )
    this.add.rectangle(ROAD_LEFT + 7, HEIGHT / 2 + 54, 14, HEIGHT - 108, COLORS.white)
    this.add.rectangle(ROAD_RIGHT - 7, HEIGHT / 2 + 54, 14, HEIGHT - 108, COLORS.white)
  }

  private createLaneDashes(): void {
    for (const x of [ROAD_CENTER - 84, ROAD_CENTER + 84]) {
      for (let y = 132; y < HEIGHT + DASH_SPACING; y += DASH_SPACING) {
        this.laneDashes.push(this.add.rectangle(x, y, 18, 92, COLORS.white))
      }
    }
  }

  private createCollectibles(): void {
    this.collectibles = COLLECTIBLE_LAYOUT.map(({ x, spawnProgress }) => {
      const sprite = this.add.star(
        x,
        COLLECTIBLE_START_Y,
        5,
        13,
        COLLECTIBLE_RADIUS,
        COLORS.yellow,
      )
      sprite.setStrokeStyle(5, COLORS.white)
      sprite.setVisible(false)
      return { x, spawnProgress, sprite, collected: false }
    })
  }

  private updateCollectibles(): void {
    for (const collectible of this.collectibles) {
      if (collectible.collected) continue

      const y = collectibleY(
        this.progress,
        collectible.spawnProgress,
        COLLECTIBLE_START_Y,
        COLLECTIBLE_END_Y,
        COLLECTIBLE_TRAVEL_PROGRESS,
      )
      const visible = this.progress >= collectible.spawnProgress && y <= COLLECTIBLE_END_Y
      collectible.sprite.setPosition(collectible.x, y)
      collectible.sprite.setVisible(visible)
      if (
        visible &&
        centeredBoundsOverlap(
          { x: this.car.x, y: this.car.y, halfWidth: CAR_HALF_WIDTH, halfHeight: CAR_HALF_HEIGHT },
          { x: collectible.x, y, halfWidth: COLLECTIBLE_RADIUS, halfHeight: COLLECTIBLE_RADIUS },
        )
      ) {
        collectible.collected = true
        collectible.sprite.setVisible(false)
        this.score += COLLECTIBLE_SCORE
        this.scoreText.setText(`⭐ ${this.score}`)
      }
    }
  }

  private createCar(): Phaser.GameObjects.Container {
    const shadow = this.add.ellipse(0, 13, 124, 176, 0x1d2732, 0.35)
    const wheels = [
      this.add.rectangle(-55, -48, 19, 48, COLORS.black),
      this.add.rectangle(55, -48, 19, 48, COLORS.black),
      this.add.rectangle(-55, 52, 19, 48, COLORS.black),
      this.add.rectangle(55, 52, 19, 48, COLORS.black),
    ]
    const body = this.add.rectangle(0, 0, 104, 164, COLORS.red)
    body.setStrokeStyle(7, 0xc92f36)
    const hood = this.add.rectangle(0, -56, 82, 39, COLORS.yellow)
    const windshield = this.add.rectangle(0, -15, 76, 42, COLORS.sky)
    windshield.setStrokeStyle(6, COLORS.navy)
    const stripe = this.add.rectangle(0, 42, 18, 63, COLORS.yellow)
    const leftLight = this.add.circle(-30, -72, 9, COLORS.white)
    const rightLight = this.add.circle(30, -72, 9, COLORS.white)

    return this.add.container(ROAD_CENTER, CAR_Y, [
      shadow,
      ...wheels,
      body,
      hood,
      windshield,
      stripe,
      leftLight,
      rightLight,
    ])
  }

  private createScoreCounter(): Phaser.GameObjects.Text {
    const counter = this.add.text(WIDTH - 34, 54, '⭐ 0', {
      color: '#18243b',
      fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif',
      fontSize: '46px',
      fontStyle: 'bold',
      stroke: '#fff8e7',
      strokeThickness: 7,
    })
    counter.setOrigin(1, 0.5)
    counter.setDepth(20)
    return counter
  }

  private createFinishLine(): Phaser.GameObjects.Container {
    const finish = this.add.container(ROAD_CENTER, -80)
    const tileWidth = 40
    const tileHeight = 30

    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 12; column += 1) {
        finish.add(
          this.add.rectangle(
            -220 + column * tileWidth,
            row * tileHeight,
            tileWidth,
            tileHeight,
            (row + column) % 2 === 0 ? COLORS.white : COLORS.black,
          ),
        )
      }
    }

    finish.setVisible(false)
    return finish
  }

  private createFinishOverlay(): Phaser.GameObjects.Container {
    const shade = this.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.navy, 0.72)
    shade.setOrigin(0)
    const panel = this.add.rectangle(WIDTH / 2, HEIGHT / 2, 560, 360, COLORS.white)
    panel.setStrokeStyle(10, COLORS.yellow)
    const title = this.add.text(WIDTH / 2, 292, 'Finished!', {
      color: '#18243b',
      fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif',
      fontSize: '76px',
      fontStyle: 'bold',
      stroke: '#ffd43b',
      strokeThickness: 8,
    })
    title.setOrigin(0.5)

    const button = this.add.rectangle(WIDTH / 2, 468, 390, 112, COLORS.red)
    button.setStrokeStyle(8, 0xc92f36)
    button.setInteractive({ useHandCursor: true })
    const label = this.add.text(WIDTH / 2, 468, 'Race again', {
      color: '#fff8e7',
      fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
    })
    label.setOrigin(0.5)

    button.on('pointerdown', () => {
      button.setScale(0.94)
    })
    button.on('pointerup', () => {
      button.setScale(1)
      this.resetRace()
    })
    button.on('pointerout', () => button.setScale(1))

    const overlay = this.add.container(0, 0, [shade, panel, title, button, label])
    overlay.setDepth(100)
    overlay.setVisible(false)
    return overlay
  }

  private steerCar(pointer: Phaser.Input.Pointer): void {
    if (this.state !== 'racing') return
    this.car.x = clampCarX(pointer.worldX, ROAD_LEFT, ROAD_RIGHT, CAR_HALF_WIDTH)
  }

  private moveRoad(delta: number): void {
    const distance = (ROAD_SPEED * delta) / 1000
    for (const dash of this.laneDashes) {
      dash.y += distance
      if (dash.y > HEIGHT + 50) dash.y -= DASH_SPACING * 5
    }
  }

  private positionFinishLine(): void {
    const finishStart = 0.72
    if (this.progress < finishStart) {
      this.finishLine.setVisible(false)
      return
    }

    const finishProgress = (this.progress - finishStart) / (1 - finishStart)
    this.finishLine.setVisible(true)
    this.finishLine.y = Phaser.Math.Linear(-70, CAR_Y - 15, finishProgress)
  }

  private finishRace(): void {
    this.state = 'finished'
    this.finishOverlay.setVisible(true)
  }

  private resetRace(): void {
    this.state = 'racing'
    this.progress = 0
    this.car.x = ROAD_CENTER
    this.finishLine.setPosition(ROAD_CENTER, -80)
    this.finishLine.setVisible(false)
    this.finishOverlay.setVisible(false)
    this.resetCollectibles()

    let dashIndex = 0
    for (const x of [ROAD_CENTER - 84, ROAD_CENTER + 84]) {
      for (let y = 132; y < HEIGHT + DASH_SPACING; y += DASH_SPACING) {
        this.laneDashes[dashIndex].setPosition(x, y)
        dashIndex += 1
      }
    }
  }

  private resetCollectibles(): void {
    this.score = 0
    this.scoreText.setText('⭐ 0')
    for (const collectible of this.collectibles) {
      collectible.collected = false
      collectible.sprite.setPosition(collectible.x, COLLECTIBLE_START_Y)
      collectible.sprite.setVisible(false)
    }
  }
}
