import Phaser from 'phaser'

import { RaceScene } from './RaceScene'
import { ResultsScene } from './ResultsScene'
import { TrackSelectScene } from './TrackSelectScene'
import './style.css'

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#38bdf8',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 768,
  },
  scene: [TrackSelectScene, RaceScene, ResultsScene],
}

new Phaser.Game(gameConfig)
