import Phaser from 'phaser'

import {
  advanceRace,
  centeredBoundsOverlap,
  clampCarX,
  collectibleY,
  isRaceFinished,
} from './gameplay'
import { getTrack, raceDurationMs, type TrackConfig, type TrackId } from './tracks'

const WIDTH = 1024
const HEIGHT = 768
const ROAD_CENTER = WIDTH / 2
const CAR_Y = 620
const CAR_HALF_WIDTH = 65
const CAR_HALF_HEIGHT = 88
const COLLECTIBLE_RADIUS = 28
const COLLECTIBLE_START_Y = -50
const COLLECTIBLE_END_Y = HEIGHT + 50
const COLLECTIBLE_TRAVEL_PROGRESS = 0.3
const COLLECTIBLE_SCORE = 10
const OBSTACLE_HALF_WIDTH = 42
const OBSTACLE_HALF_HEIGHT = 34
const OBSTACLE_START_Y = -50
const OBSTACLE_END_Y = HEIGHT + 50
const OBSTACLE_TRAVEL_PROGRESS = 0.3
const OBSTACLE_PENALTY = 10
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
  { lane: -0.28, spawnProgress: 0.02 },
  { lane: 0.28, spawnProgress: 0.14 },
  { lane: 0, spawnProgress: 0.26 },
  { lane: 0.28, spawnProgress: 0.38 },
  { lane: -0.28, spawnProgress: 0.5 },
  { lane: 0, spawnProgress: 0.62 },
] as const

const OBSTACLE_LAYOUT = [
  { lane: 0, spawnProgress: 0.08 },
  { lane: -0.28, spawnProgress: 0.2 },
  { lane: 0.28, spawnProgress: 0.44 },
  { lane: 0, spawnProgress: 0.56 },
] as const

interface Collectible {
  x: number
  spawnProgress: number
  sprite: Phaser.GameObjects.Text
  collected: boolean
}

interface Obstacle {
  x: number
  spawnProgress: number
  sprite: Phaser.GameObjects.Text
  hit: boolean
}

export interface RaceResults {
  trackId: TrackId
  score: number
  collected: number
  obstaclesHit: number
}

type RaceState = 'racing' | 'finished'

export class RaceScene extends Phaser.Scene {
  private track: TrackConfig = getTrack()
  private roadLeft = ROAD_CENTER - this.track.roadWidth / 2
  private roadRight = ROAD_CENTER + this.track.roadWidth / 2
  private state: RaceState = 'racing'
  private progress = 0
  private car!: Phaser.GameObjects.Container
  private score = 0
  private scoreText!: Phaser.GameObjects.Text
  private collectibles: Collectible[] = []
  private obstacles: Obstacle[] = []
  private laneDashes: Phaser.GameObjects.Rectangle[] = []
  private finishLine!: Phaser.GameObjects.Container

  constructor() {
    super('race')
  }

  init(data: { trackId?: string }): void {
    this.track = getTrack(data.trackId)
    this.roadLeft = ROAD_CENTER - this.track.roadWidth / 2
    this.roadRight = ROAD_CENTER + this.track.roadWidth / 2
  }

  create(): void {
    this.drawTrackTheme()
    this.drawRoad()
    this.createLaneDashes()
    this.createCollectibles()
    this.createObstacles()
    this.finishLine = this.createFinishLine()
    this.car = this.createCar()
    this.scoreText = this.createScoreCounter()

    this.input.on('pointerdown', this.steerCar, this)
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) this.steerCar(pointer)
    })

    this.resetRace()
  }

  update(_time: number, delta: number): void {
    if (this.state !== 'racing') return

    const safeDelta = Math.min(delta, 50)
    this.progress = advanceRace(this.progress, delta, raceDurationMs(this.track.speed))
    this.moveRoad(safeDelta)
    this.positionFinishLine()
    this.updateCollectibles()
    this.updateObstacles()

    if (isRaceFinished(this.progress)) this.finishRace()
  }

  private drawTrackTheme(): void {
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, this.track.groundColor)
    this.add.rectangle(WIDTH / 2, 54, WIDTH, 108, this.track.skyColor)

    this.add.circle(80, 50, 27, COLORS.yellow)
    this.add.circle(164, 48, 20, COLORS.white)
    this.add.circle(188, 40, 26, COLORS.white)
    this.add.circle(216, 50, 19, COLORS.white)
    this.add.circle(840, 54, 18, COLORS.white)
    this.add.circle(865, 43, 27, COLORS.white)
    this.add.circle(895, 54, 18, COLORS.white)

    if (this.track.id === 'backyard') {
      this.drawTree(112, 218)
      this.drawTree(900, 238)
      this.drawFlowers(132, 470)
      this.drawFlowers(884, 510)
    } else if (this.track.id === 'forest') {
      this.drawTree(105, 210)
      this.drawTree(900, 225)
      this.drawTree(135, 540)
      this.drawTree(885, 570)
    } else {
      this.add.circle(105, 220, 54, 0xffa95c)
      this.add.circle(910, 250, 46, 0xff7f66)
      this.add.circle(110, 570, 34, 0xfff8e7)
      this.add.circle(900, 590, 38, 0xfff8e7)
    }

    const trackName = this.add.text(34, 54, `${this.track.emoji} ${this.track.name}`, {
      color: '#18243b',
      fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      stroke: '#fff8e7',
      strokeThickness: 6,
    })
    trackName.setOrigin(0, 0.5)
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
      this.track.roadWidth,
      HEIGHT - 108,
      COLORS.asphalt,
    )
    this.add.rectangle(this.roadLeft + 7, HEIGHT / 2 + 54, 14, HEIGHT - 108, COLORS.white)
    this.add.rectangle(this.roadRight - 7, HEIGHT / 2 + 54, 14, HEIGHT - 108, COLORS.white)
  }

  private createLaneDashes(): void {
    this.laneDashes = []
    for (const x of this.laneDashXs()) {
      for (let y = 132; y < HEIGHT + DASH_SPACING; y += DASH_SPACING) {
        this.laneDashes.push(this.add.rectangle(x, y, 18, 92, COLORS.white))
      }
    }
  }

  private createCollectibles(): void {
    this.collectibles = COLLECTIBLE_LAYOUT.map(({ lane, spawnProgress }, index) => {
      const x = this.laneX(lane)
      const sprite = this.add.text(
        x,
        COLLECTIBLE_START_Y,
        this.track.collectibles[index % this.track.collectibles.length],
        { fontSize: '54px', fontFamily: 'Arial, sans-serif' },
      )
      sprite.setOrigin(0.5)
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

  private createObstacles(): void {
    this.obstacles = OBSTACLE_LAYOUT.map(({ lane, spawnProgress }, index) => {
      const x = this.laneX(lane)
      const sprite = this.add.text(
        x,
        OBSTACLE_START_Y,
        this.track.obstacles[index % this.track.obstacles.length],
        { fontSize: '58px', fontFamily: 'Arial, sans-serif' },
      )
      sprite.setOrigin(0.5)
      sprite.setVisible(false)
      return { x, spawnProgress, sprite, hit: false }
    })
  }

  private updateObstacles(): void {
    for (const obstacle of this.obstacles) {
      if (obstacle.hit) continue

      const y = collectibleY(
        this.progress,
        obstacle.spawnProgress,
        OBSTACLE_START_Y,
        OBSTACLE_END_Y,
        OBSTACLE_TRAVEL_PROGRESS,
      )
      const visible = this.progress >= obstacle.spawnProgress && y <= OBSTACLE_END_Y
      obstacle.sprite.setPosition(obstacle.x, y)
      obstacle.sprite.setVisible(visible)
      if (
        visible &&
        centeredBoundsOverlap(
          { x: this.car.x, y: this.car.y, halfWidth: CAR_HALF_WIDTH, halfHeight: CAR_HALF_HEIGHT },
          {
            x: obstacle.x,
            y,
            halfWidth: OBSTACLE_HALF_WIDTH,
            halfHeight: OBSTACLE_HALF_HEIGHT,
          },
        )
      ) {
        obstacle.hit = true
        obstacle.sprite.setVisible(false)
        this.score = Math.max(0, this.score - OBSTACLE_PENALTY)
        this.scoreText.setText(`⭐ ${this.score}`)
        this.playObstacleFeedback()
      }
    }
  }

  private playObstacleFeedback(): void {
    this.tweens.killTweensOf(this.car)
    this.car.setAngle(0)
    this.car.setScale(1)
    this.tweens.add({
      targets: this.car,
      angle: { from: -8, to: 0 },
      scaleX: { from: 0.9, to: 1 },
      scaleY: { from: 1.08, to: 1 },
      duration: 220,
      ease: 'Bounce.Out',
    })
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
    const tileWidth = this.track.roadWidth / 12
    const tileHeight = 30

    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 12; column += 1) {
        finish.add(
          this.add.rectangle(
            -this.track.roadWidth / 2 + tileWidth / 2 + column * tileWidth,
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

  private steerCar(pointer: Phaser.Input.Pointer): void {
    if (this.state !== 'racing') return
    this.car.x = clampCarX(pointer.worldX, this.roadLeft, this.roadRight, CAR_HALF_WIDTH)
  }

  private moveRoad(delta: number): void {
    const distance = (this.track.speed * delta) / 1000
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
    if (this.state === 'finished') return
    this.state = 'finished'
    this.scene.start('results', {
      trackId: this.track.id,
      score: this.score,
      collected: this.collectibles.filter(({ collected }) => collected).length,
      obstaclesHit: this.obstacles.filter(({ hit }) => hit).length,
    } satisfies RaceResults)
  }

  private resetRace(): void {
    this.state = 'racing'
    this.progress = 0
    this.car.x = ROAD_CENTER
    this.finishLine.setPosition(ROAD_CENTER, -80)
    this.finishLine.setVisible(false)
    this.resetCollectibles()
    this.resetObstacles()

    let dashIndex = 0
    for (const x of this.laneDashXs()) {
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

  private resetObstacles(): void {
    this.tweens.killTweensOf(this.car)
    this.car.setAngle(0)
    this.car.setScale(1)
    for (const obstacle of this.obstacles) {
      obstacle.hit = false
      obstacle.sprite.setPosition(obstacle.x, OBSTACLE_START_Y)
      obstacle.sprite.setVisible(false)
    }
  }

  private laneX(lane: number): number {
    return ROAD_CENTER + lane * this.track.roadWidth
  }

  private laneDashXs(): [number, number] {
    return [ROAD_CENTER - this.track.roadWidth / 6, ROAD_CENTER + this.track.roadWidth / 6]
  }
}
