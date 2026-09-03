export namespace Api {
  export interface ApiSuccessResult {
    code: number,
    success: true,
    data: any
  }
  export interface ApiErrorBody {
    error_id: string,
    args: any[],
    message: string
  }
  export interface ApiErrorResult {
    code: number,
    success: false,
    data: ApiErrorBody
  }

  export function getUrl(path: string, dataViaUrlParam: Object | null = null) {
    return '../api/' + path + (
      dataViaUrlParam != null ? ('?data=' + encodeURIComponent(JSON.stringify(dataViaUrlParam))) : ''
    )
  }

  async function call(method: 'get' | 'post', path: string, data: Object = {}): Promise<ApiSuccessResult | ApiErrorResult> {
    let response = null
    try {
      response = await fetch(getUrl(path), {
        method: method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch(err) {
      console.log(err)
      return {
        code: 0,
        success: false,
        data: { error_id: 'network_error', args: [], message: 'Network error.' }
      } satisfies ApiErrorResult
    }
    let json: any = null
    try {
      json = await response.json()
    } catch(err) {
      return {
        code: 0,
        success: false,
        data: { error_id: 'malformed_response', args: [], message: 'Malformed response.' }
      } satisfies ApiErrorResult
    }
    return json
  }
  export async function post(path: string, data: Object = {}) {
    const result = await call('post', path, data)
    // await new Promise((ok) => setTimeout(ok, 1000))  // Deliberate throttle for testing
    return result
  }
}
