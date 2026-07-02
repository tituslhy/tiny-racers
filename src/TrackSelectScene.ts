import Phaser from 'phaser'

import { TRACKS, type TrackConfig } from './tracks'

const WIDTH = 1024
const HEIGHT = 768
const FONT = 'Arial Rounded MT Bold, Trebuchet MS, sans-serif'

const CARD_X = [190, 512, 834] as const

export class TrackSelectScene extends Phaser.Scene {
  constructor() {
    super('track-select')
  }

  create(): void {
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x38bdf8)
    this.add.circle(76, 70, 38, 0xffd43b)
    this.add.circle(950, 700, 62, 0x65c466)

    const heading = this.add.text(WIDTH / 2, 86, 'Choose Your Track!', {
      color: '#18243b',
      fontFamily: FONT,
      fontSize: '64px',
      fontStyle: 'bold',
      stroke: '#fff8e7',
      strokeThickness: 9,
    })
    heading.setOrigin(0.5)

    Object.values(TRACKS).forEach((track, index) => {
      this.createTrackCard(CARD_X[index], track)
    })
  }

  private createTrackCard(x: number, track: TrackConfig): void {
    const button = this.add.rectangle(x, 414, 280, 450, track.groundColor)
    button.setStrokeStyle(10, 0xfff8e7)
    button.setInteractive({ useHandCursor: true })

    this.add.rectangle(x, 240, 250, 82, track.skyColor)
    this.add.rectangle(x, 365, 112, 190, 0x404858)
    this.add.rectangle(x, 365, 10, 72, 0xfff8e7)

    const name = this.add.text(x, 210, `${track.emoji} ${track.name}`, {
      color: '#18243b',
      fontFamily: FONT,
      fontSize: '34px',
      fontStyle: 'bold',
      align: 'center',
    })
    name.setOrigin(0.5)

    const collect = this.add.text(x, 535, track.collectibles.join('  '), {
      fontFamily: FONT,
      fontSize: '38px',
    })
    collect.setOrigin(0.5)

    const avoid = this.add.text(x, 592, track.obstacles.join('  '), {
      fontFamily: FONT,
      fontSize: '34px',
    })
    avoid.setOrigin(0.5)

    button.on('pointerdown', () => button.setScale(0.96))
    button.on('pointerup', () => {
      button.setScale(1)
      this.scene.start('race', { trackId: track.id })
    })
    button.on('pointerout', () => button.setScale(1))
  }
}
