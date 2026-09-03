import { plainToInstance } from "class-transformer"
import { TempleItemData } from "./TempleItemData"
import type { InjectionKey, Ref } from "vue"
import { Api } from "../../api/Api"
import { ApiError } from "../ApiError"
import typia from "typia"
import { TransformNPDict } from "../../utils/class_transform"

export class ApiTemplesData {
  editing_allowed!: boolean

  @TransformNPDict(TempleItemData)
  temples!: Record<string, TempleItemData>

  static injectionKey: InjectionKey<Ref<ApiTemplesData | null>> = Symbol('ApiTemplesData')
  static getLoaderForGame(gameKey: string | Ref<string>) {
    async function apiTemplesLoader(): Promise<ApiTemplesData> {
      const result = await Api.post('temples', { game: (typeof gameKey == 'string') ? gameKey : gameKey.value })
      if(result.success) {
        typia.assert<ApiTemplesData>(result.data)
        return plainToInstance(ApiTemplesData, result.data)
      } else {
        throw ApiError.fromApi(result.data)
      }
    }
    return apiTemplesLoader
  }
}
