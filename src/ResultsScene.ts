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

    this.addCenteredText(512, 104, 'Amazing Driving!', '64px', '#18243b', {
      stroke: '#ffd43b',
      strokeThickness: 8,
    })
    const trophy = this.addCenteredText(512, 178, '🏆', '64px', '#18243b')

    const scoreCard = this.add.rectangle(512, 275, 500, 150, COLORS.yellow)
    scoreCard.setStrokeStyle(7, COLORS.red)
    this.addCenteredText(512, 235, 'SCORE', '32px', '#18243b')
    this.addCenteredText(512, 292, `${this.results.score}`, '82px', '#f04444')

    const collectedCard = this.add.rectangle(385, 410, 230, 130, 0xfff2bd)
    collectedCard.setStrokeStyle(6, COLORS.green)
    this.addCenteredText(385, 387, `${this.results.collected}`, '58px', '#18243b')
    this.addCenteredText(385, 442, 'Collected', '28px', '#18243b')

    const bumpsCard = this.add.rectangle(639, 410, 230, 130, 0xffe1dc)
    bumpsCard.setStrokeStyle(6, COLORS.red)
    this.addCenteredText(639, 387, `${this.results.obstaclesHit}`, '58px', '#18243b')
    this.addCenteredText(639, 442, 'Silly Bumps', '28px', '#18243b')

    this.createButton(565, 'Race Again', COLORS.red, COLORS.redDark, () => {
      this.scene.start('race', { trackId: this.results.trackId })
    })
    this.createButton(680, 'Choose Track', COLORS.blue, 0x1857ad, () => {
      this.scene.start('track-select')
    })

    this.playCelebration(trophy)
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
    const button = this.add.rectangle(WIDTH / 2, y, 500, 96, color)
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

  private playCelebration(trophy: Phaser.GameObjects.Text): void {
    trophy.setScale(0.75)
    this.tweens.add({
      targets: trophy,
      scale: 1,
      duration: 360,
      ease: 'Back.Out',
    })

    const colors = [COLORS.yellow, COLORS.red, COLORS.green, COLORS.blue]
    for (let index = 0; index < 12; index += 1) {
      const left = index % 2 === 0
      const x = left ? 150 + (index % 3) * 28 : 874 - (index % 3) * 28
      const y = 90 + (index % 6) * 82
      const piece = this.add.rectangle(x, y, 14, 28, colors[index % colors.length])
      piece.setDepth(2)
      this.tweens.add({
        targets: piece,
        y: y + 110,
        angle: left ? 150 : -150,
        alpha: 0,
        duration: 760 + index * 20,
        delay: index * 35,
        ease: 'Sine.Out',
        onComplete: () => piece.destroy(),
      })
    }
  }
}
