import type { InjectionKey, Ref } from "vue"
import CheatFlagDef from "./CheatFlagDef"
import TextsData from "./TextsData"
import { Api } from "../../api/Api"
import ApiError from "../ApiError"
import typia from "typia"
import { plainToInstance, Type } from "class-transformer"
import GameItemData from "./GameItemData"
import { TransformNPDict } from "../../utils/class_transform"

export default class ApiHomeData {
  @TransformNPDict(GameItemData)
  games!: Record<string, GameItemData>

  @TransformNPDict(CheatFlagDef)
  cheat_flag_defs!: Record<string, CheatFlagDef>
  
  @Type(() => TextsData)
  texts!: TextsData

  static injectionKey: InjectionKey<Ref<ApiHomeData | null>> = Symbol('ApiHomeData')
  static async loader(): Promise<ApiHomeData> {
    const result = await Api.post('home')
    if(result.success) {
      typia.assert<ApiHomeData>(result.data)
      return plainToInstance(ApiHomeData, result.data)
    } else {
      throw ApiError.fromApi(result.data)
    }
  }
}
