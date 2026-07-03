import Phaser from 'phaser'

import { waitForOfflineReady } from './offlineReady'
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
      this.createTrackCard(CARD_X[index], track, index)
    })

    const badgeColor = 0xa8e063
    this.add.rectangle(WIDTH / 2, 710, 400, 62, badgeColor)
    this.add.circle(WIDTH / 2 - 200, 710, 31, badgeColor)
    this.add.circle(WIDTH / 2 + 200, 710, 31, badgeColor)

    const status = this.add.text(WIDTH / 2, 710, 'Getting travel-ready…', {
      color: '#18243b',
      fontFamily: FONT,
      fontSize: '26px',
      fontStyle: 'bold',
    })
    status.setOrigin(0.5)

    void waitForOfflineReady().then((ready) => {
      if (ready && status.active) status.setText('✅ Ready to play offline')
    })
  }

  private createTrackCard(x: number, track: TrackConfig, index: number): void {
    const card = this.add.container(x, 414)
    card.setSize(280, 450)
    card.setInteractive({ useHandCursor: true })

    const shadow = this.add.rectangle(8, 10, 280, 450, 0x18243b, 0.24)
    const panel = this.add.rectangle(0, 0, 280, 450, track.groundColor)
    panel.setStrokeStyle(10, track.accentColor)
    card.add([shadow, panel])

    this.addTrackPreview(card, track)

    const name = this.add.text(0, -204, `${track.emoji} ${track.name}`, {
      color: '#18243b',
      fontFamily: FONT,
      fontSize: '34px',
      fontStyle: 'bold',
      align: 'center',
    })
    name.setOrigin(0.5)
    card.add(name)

    const collectBacking = this.add.rectangle(0, 121, 240, 50, 0xfff3b0)
    const collect = this.add.text(0, 121, track.collectibles.join('  '), {
      fontFamily: FONT,
      fontSize: '38px',
    })
    collect.setOrigin(0.5)

    const avoidBacking = this.add.rectangle(0, 178, 240, 50, 0xffc4b8)
    const avoid = this.add.text(0, 178, track.obstacles.join('  '), {
      fontFamily: FONT,
      fontSize: '34px',
    })
    avoid.setOrigin(0.5)
    card.add([collectBacking, collect, avoidBacking, avoid])

    card.on('pointerdown', () => card.setScale(0.96))
    card.on('pointerout', () => card.setScale(1))
    card.on('pointerup', () => {
      card.setScale(1)
      this.scene.start('race', { trackId: track.id })
    })

    card.setScale(0.9)
    this.tweens.add({
      targets: card,
      scale: 1,
      duration: 180,
      delay: index * 70,
      ease: 'Back.Out',
    })
  }

  private addTrackPreview(card: Phaser.GameObjects.Container, track: TrackConfig): void {
    const sky = this.add.rectangle(0, -174, 250, 82, track.skyColor)
    const road = this.add.rectangle(0, -49, 112, 190, 0x404858)
    const roadStripe = this.add.rectangle(0, -49, 10, 72, 0xfff8e7)
    card.add([sky, road, roadStripe])

    if (track.id === 'backyard') {
      const fence = [-96, -72, -48].map((x) =>
        this.add.rectangle(x, -74, 16, 76, 0xfff8e7),
      )
      const flowers = [
        this.add.circle(70, -91, 9, 0xff7f66),
        this.add.circle(96, -66, 9, 0xffd43b),
        this.add.circle(76, -39, 9, 0xffffff),
      ]
      card.add([...fence, ...flowers])
    } else if (track.id === 'forest') {
      const trunks = [
        this.add.rectangle(-91, -66, 18, 74, 0x8b5a2b),
        this.add.rectangle(87, -77, 18, 74, 0x8b5a2b),
      ]
      const canopies = [
        this.add.circle(-104, -110, 27, 0x3f8f4f),
        this.add.circle(-78, -112, 30, 0x65c466),
        this.add.circle(75, -121, 29, 0x3f8f4f),
        this.add.circle(99, -116, 27, 0x65c466),
      ]
      const mushrooms = [
        this.add.text(-113, 31, '🍄', { fontSize: '25px' }),
        this.add.text(88, 35, '🍄', { fontSize: '25px' }),
      ]
      card.add([...trunks, ...canopies, ...mushrooms])
    } else if (track.id === 'beach') {
      const sun = this.add.circle(-94, -177, 25, 0xffd43b)
      const waves = [
        this.add.rectangle(-88, -85, 58, 9, 0x43c6db),
        this.add.rectangle(88, -55, 58, 9, 0x43c6db),
      ]
      card.add([sun, ...waves])
    }
  }
}
