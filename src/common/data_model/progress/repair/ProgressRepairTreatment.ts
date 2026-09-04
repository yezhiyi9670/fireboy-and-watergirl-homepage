import { TransformNPDict } from "../../../utils/class_transform";
import ProgressRepairLevelList from "./ProgressRepairLevelList";

export default class ProgressRepairTreatment {
  @TransformNPDict(ProgressRepairLevelList)
  templeIdToLevelList: Record<string, ProgressRepairLevelList> = Object.create(null)
  
  unexpectedTempleIds: string[] = []
}
