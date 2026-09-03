export class ExtraLevelsInfoData {
  levels_desc?: string
  modified?: string

  canBeConsideredNew(date?: Date) {
    if(this.modified == null) {
      return false
    }
    const theDate = new Date(this.modified)
    const thresholdMillis = 1000 * 86400 * 14
    return (+(date ?? new Date())) - (+theDate) < thresholdMillis
  }
}
