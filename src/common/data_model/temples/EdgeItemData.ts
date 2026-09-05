export default class EdgeItemData {
  id!: number | string
  source!: number | string
  target!: number | string
  _id?: number | string
  hidden?: boolean

  /**
   * `_id` and `id` are not guaranteed unique in the source data, so an edge is
   * identified by the combination of all four of its key fields.
   */
  getUniqueId() {
    return JSON.stringify([this._id, this.id, this.source, this.target])
  }
}
