import type ApiTemplesData from '../../../common/data_model/temples/ApiTemplesData.ts'
import type TempleItemData from '../../../common/data_model/temples/TempleItemData.ts'
import type LevelItemData from '../../../common/data_model/temples/LevelItemData.ts'

export type SubmitPlan = {
  dirtyTemples: { templeKey: string, temple: TempleItemData }[]
  deleteFiles: string[]
  newFiles: string[]
  sources: Record<string, string>
}

function usedFileSet(data: ApiTemplesData) {
  const set = new Set<string>()
  for(const temple of Object.values(data.temples)) {
    for(const level of temple.levels) {
      set.add(level.filename)
    }
  }
  return set
}

function getClonedFrom(level: LevelItemData): string | number | null {
  const record = level as unknown as Record<string, unknown>
  const from = record.__cloned_from ?? record.__cloned_from_iid
  return from == null ? null : (from as string | number)
}

function findLevelByIid(data: ApiTemplesData, iid: string | number): LevelItemData | null {
  for(const temple of Object.values(data.temples)) {
    const level = temple.getLevelByIid(iid)
    if(level != null) {
      return level
    }
  }
  return null
}

export function computeSubmitPlan(after: ApiTemplesData, before: ApiTemplesData): SubmitPlan {
  const dirtyTemples = Object.entries(after.temples)
    .filter(([, temple]) => temple.isDirty())
    .map(([templeKey, temple]) => ({ templeKey, temple }))

  const beforeFiles = usedFileSet(before)
  const afterFiles = usedFileSet(after)

  const deleteFiles = [ ...beforeFiles ].filter(name => !afterFiles.has(name)).sort()
  const newSet = new Set([ ...afterFiles ].filter(name => !beforeFiles.has(name)))
  const newFiles = [ ...newSet ].sort()
  const sources: Record<string, string> = {}

  for(const filename of newFiles) {
    // Pick one level that uses this file.
    let level: LevelItemData | null = null
    for(const temple of Object.values(after.temples)) {
      level = temple.levels.find(candidate => candidate.filename === filename) ?? null
      if(level != null) {
        break
      }
    }
    if(level == null) {
      continue
    }
    // Walk the __cloned_from chain looking for an ancestor that already existed.
    const visited = new Set<string | number>()
    let current: LevelItemData | null = level
    let isClone = false
    while(current != null) {
      const from = getClonedFrom(current)
      if(from == null || visited.has(from)) {
        break
      }
      visited.add(from)
      const ancestor = findLevelByIid(after, from)
      if(ancestor == null) {
        break
      }
      if(!newSet.has(ancestor.filename)) {
        sources[filename] = ancestor.filename
        isClone = true
        break
      }
      current = ancestor
    }
    void isClone
  }

  return { dirtyTemples, deleteFiles, newFiles, sources }
}
