export default class LevelProgress {
  _id!: number | string
  played?: boolean
  best?: BestRecords

  hasPlayed() {
    return !!this.played
  }
  hasFinished() {
    return this.best != null 
  }
  bestTime() {
    return this.best?.time ?? -1
  }
  bestStars() {
    return this.best?.stars ?? 0
  }
  starsGradeNotation() {
    const stars = this.bestStars()
    if(stars == 3) return 'A'
    if(stars == 2) return 'B'
    if(stars == 1) return 'C'
    if(stars == 0) return 'F'
    return '???'
  }
  isPerfect() {
    return this.bestStars() == 3
  }
  isFail() {
    return this.bestStars() == 0
  }
}

export interface BestRecords {
  time: number
  stars: number
}
