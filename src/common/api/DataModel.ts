import type { InjectionKey, Ref } from "vue";
import { Api } from "./Api";

export namespace DataModel {
  class ApiError extends Error {
    constructor(
      public errorBody: Api.ApiError,
      message?: string,
      options?: ErrorOptions
    ) {
      super(message, options)
    }
    static fromApi(errorBody: Api.ApiError) {
      // TODO: Add localized error messages.
      return new ApiError(errorBody, errorBody.message)
    }
  }

  // ======== Home ========

  export interface ExtraLevelsInfoData {
    levels_desc?: string
    modified?: string
  }
  export interface GameInfoData {
    type: 'legacy' | 'multi'
    temples: string[]
  }
  export interface GameUrlInfo {
    base?: string
    play?: string
    banner?: string
    banner_bg?: string
  }
  export function getUrls(info?: GameUrlInfo) {
    const base = info?.base ?? ''
    return {
      play: info?.play != null ? (base + info.play) : undefined,
      banner: info?.banner != null ? (base + info.banner) : undefined,
      banner_bg: info?.banner_bg != null ? (base + info.banner_bg) : undefined,
    }
  }
  export interface GameItemData {
    name: string
    url?: GameUrlInfo
    storage_namespace: string
    cheat_flags?: string[]
    extras?: ExtraLevelsInfoData
    created?: string
    info?: GameInfoData
    accept_legacy_import?: boolean
  }
  export interface GamesData {
    [gameKey: string]: GameItemData
  }
  export interface CheatFlagDef {
    name: string
    description?: string
  }
  export interface CheatFlagsData {
    [flag: string]: CheatFlagDef
  }
  export interface TextsData {
    homepage_pre?: string
    gamelist_post?: string
    progress_post?: string
    homepage_post?: string
    modification_notes?: string
  }
  interface ApiHomeData {
    games: GamesData
    cheat_flag_defs: CheatFlagsData
    texts: TextsData
  }
  export const apiHomeKey: InjectionKey<Ref<ApiHomeData | null>> = Symbol('apiHome')
  export async function apiHomeLoader(): Promise<ApiHomeData> {
    const result = await Api.post('home')
    if(result.success) {
      return result.data as ApiHomeData
    } else {
      throw ApiError.fromApi(result.data)
    }
  }
}
