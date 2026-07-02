import Phaser from 'phaser'

import type { RaceResults } from './RaceScene'
import { getTrack } from './tracks'

const WIDTH = 1024
const HEIGHT = 768
const FONT = 'Arial Rounded MT Bold, Trebuchet MS, sans-serif'

const COLORS = {
  sky: 0x38bdf8,
  blue: 0x2674d9,
  green: 0x65c466,
  navy: 0x18243b,
  red: 0xf04444,
  redDark: 0xc92f36,
  white: 0xfff8e7,
  yellow: 0xffd43b,
}

export class ResultsScene extends Phaser.Scene {
  private results: RaceResults = {
    trackId: 'backyard',
    score: 0,
    collected: 0,
    obstaclesHit: 0,
  }

  constructor() {
    super('results')
  }

  init(data: RaceResults): void {
    this.results = {
      trackId: getTrack(data.trackId).id,
      score: Math.max(0, data.score),
      collected: Math.max(0, data.collected),
      obstaclesHit: Math.max(0, data.obstaclesHit),
    }
  }

  create(): void {
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, COLORS.sky)
    this.add.circle(90, 100, 54, COLORS.yellow)
    this.add.circle(920, 670, 78, COLORS.green)
    this.add.circle(85, 690, 34, COLORS.red)
    this.add.circle(935, 92, 28, COLORS.white)

    const panel = this.add.rectangle(WIDTH / 2, HEIGHT / 2, 700, 690, COLORS.white)
    panel.setStrokeStyle(12, COLORS.yellow)

    this.drawCheckeredCorner(196, 66)
    this.drawCheckeredCorner(780, 66)

    this.addCenteredText(512, 142, 'Amazing Driving!', '64px', '#18243b', {
      stroke: '#ffd43b',
      strokeThickness: 8,
    })
    this.addCenteredText(512, 248, `Score: ${this.results.score}`, '68px', '#f04444')
    this.addCenteredText(
      512,
      338,
      `Collected: ${this.results.collected} items`,
      '38px',
      '#18243b',
    )
    this.addCenteredText(
      512,
      392,
      `Obstacles Hit: ${this.results.obstaclesHit}`,
      '38px',
      '#18243b',
    )

    this.createButton(510, 'Race Again', COLORS.red, COLORS.redDark, () => {
      this.scene.start('race', { trackId: this.results.trackId })
    })
    this.createButton(622, 'Choose Track', COLORS.blue, 0x1857ad, () => {
      this.scene.start('track-select')
    })
  }

  private drawCheckeredCorner(startX: number, startY: number): void {
    const size = 22
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        this.add.rectangle(
          startX + column * size,
          startY + row * size,
          size,
          size,
          (row + column) % 2 === 0 ? COLORS.navy : COLORS.white,
        )
      }
    }
  }

  private addCenteredText(
    x: number,
    y: number,
    value: string,
    fontSize: string,
    color: string,
    extra: Phaser.Types.GameObjects.Text.TextStyle = {},
  ): Phaser.GameObjects.Text {
    const text = this.add.text(x, y, value, {
      color,
      fontFamily: FONT,
      fontSize,
      fontStyle: 'bold',
      align: 'center',
      ...extra,
    })
    text.setOrigin(0.5)
    return text
  }

  private createButton(
    y: number,
    label: string,
    color: number,
    borderColor: number,
    onPress: () => void,
  ): void {
    const button = this.add.rectangle(WIDTH / 2, y, 420, 88, color)
    button.setStrokeStyle(7, borderColor)
    button.setInteractive({ useHandCursor: true })

    const text = this.addCenteredText(WIDTH / 2, y, label, '42px', '#fff8e7')

    button.on('pointerdown', () => {
      button.setScale(0.95)
      text.setScale(0.95)
    })
    button.on('pointerup', () => {
      button.setScale(1)
      text.setScale(1)
      onPress()
    })
    button.on('pointerout', () => {
      button.setScale(1)
      text.setScale(1)
    })
  }
}
