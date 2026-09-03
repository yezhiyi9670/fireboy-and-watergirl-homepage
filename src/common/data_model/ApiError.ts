import type { Api } from "../api/Api"

export default class ApiError extends Error {
  constructor(
    public errorBody: Api.ApiErrorBody,
    message?: string,
    options?: ErrorOptions
  ) {
    super(message, options)
  }
  static fromApi(errorBody: Api.ApiErrorBody) {
    // TODO: Add localized error messages.
    return new ApiError(errorBody, errorBody.message)
  }
}
