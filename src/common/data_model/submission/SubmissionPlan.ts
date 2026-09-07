import { TransformNPDict } from "../../utils/class_transform"
import TempleItemData from "../temples/TempleItemData"
import type LevelItemData from "../temples/LevelItemData"
import type ApiTemplesData from "../temples/ApiTemplesData"

/**
 * Describes what a submission of an editing session would change:
 * which temples are dirty, which level files are removed/created, and for each
 * newly created file which existing file it should be copied from.
 */
export default class SubmissionPlan {
  @TransformNPDict(TempleItemData)
  temples: Record<string, TempleItemData> = {}

  newFiles: string[] = []
  sources: Record<string, string> = {}
  deleteFiles: string[] = []

  private static usedFileSet(data: ApiTemplesData) {
    const set = new Set<string>()
    for(const temple of Object.values(data.temples)) {
      for(const level of temple.levels) {
        set.add(level.filename)
      }
    }
    return set
  }

  private static levelUsingFile(data: ApiTemplesData, filename: string): LevelItemData | null {
    for(const temple of Object.values(data.temples)) {
      for(const level of temple.levels) {
        if(level.filename === filename) {
          return level
        }
      }
    }
    return null
  }

  static compute(after: ApiTemplesData, before: ApiTemplesData): SubmissionPlan {
    const plan = new SubmissionPlan()

    for(const [ templeKey, temple ] of Object.entries(after.temples)) {
      if(temple.isDirty()) {
        plan.temples[templeKey] = temple
      }
    }

    const beforeFiles = this.usedFileSet(before)
    const afterFiles = this.usedFileSet(after)

    plan.newFiles = [ ...afterFiles ].filter(name => !beforeFiles.has(name)).sort()
    for(const filename of plan.newFiles) {
      const level = this.levelUsingFile(after, filename)
      const source = level?.__source_filename
      if(typeof source === 'string' && source !== filename) {
        plan.sources[filename] = source
      }
    }
    plan.deleteFiles = [ ...beforeFiles ].filter(name => !afterFiles.has(name)).sort()

    return plan
  }
}
