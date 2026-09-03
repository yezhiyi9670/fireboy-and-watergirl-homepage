export class GameUrlInfo {
  base?: string
  play?: string
  banner?: string
  banner_bg?: string

  getUrls() {
    const base = this.base ?? ''
    return {
      play: this.play != null ? (base + this.play) : undefined,
      banner: this.banner != null ? (base + this.banner) : undefined,
      banner_bg: this.banner_bg != null ? (base + this.banner_bg) : undefined,
    }
  }
}
