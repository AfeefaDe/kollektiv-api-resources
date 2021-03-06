import axios, { AxiosError } from 'axios'

import { Action } from '../action/Action'
import { ApiError } from './ApiError'
import { ApiResponse } from './ApiResponse'

export type ApiRequestJSON = {
  api: string,
  resource: string
  action: string
  scopes: Record<string, unknown>
  filters: Record<string, unknown>
  fields: Record<string, unknown>
  params: Record<string, unknown>
}

export class ApiRequest {
  private _action!: Action
  private _fields: Record<string, unknown> = {}
  private _scopes!: Record<string, unknown>
  private _filters!: Record<string, unknown>
  private _params!: Record<string, unknown>
  private _data!: Record<string, unknown>

  // private _lastRequestJSON: string = ''
  // private _lastRequest!: Promise<ApiResponse | boolean>

  constructor (json?: ApiRequestJSON) {
    if (json) {
      this._fields = json.fields

      if (json.scopes) {
        this._scopes = json.scopes
      }

      if (json.filters) {
        this._filters = json.filters
      }

      if (json.params) {
        this._params = json.params
      }
    }
  }

  public action (action: Action): ApiRequest {
    this._action = action
    return this
  }

  public getAction (): Action {
    return this._action
  }

  public fields (fields: Record<string, unknown>): ApiRequest {
    this._fields = fields
    return this
  }

  public addField (name: string, value: unknown): ApiRequest {
    this._fields[name] = value
    return this
  }

  public addFields (fields: Record<string, unknown>): ApiRequest {
    this._fields = {
      ...this._fields,
      ...fields
    }
    return this
  }

  public scopes (scopes: Record<string, unknown>): ApiRequest {
    this._scopes = scopes
    return this
  }

  public filters (filters: Record<string, unknown>): ApiRequest {
    this._filters = filters
    return this
  }

  public addFilter (name: string, value: unknown): ApiRequest {
    this._filters[name] = value
    return this
  }

  public addFilters (filters: Record<string, unknown>): ApiRequest {
    this._filters = {
      ...this._filters,
      ...filters
    }
    return this
  }

  public params (params: Record<string, unknown>): ApiRequest {
    this._params = params
    return this
  }

  public data (data: Record<string, unknown>): ApiRequest {
    this._data = data
    return this
  }

  public send (): Promise<ApiResponse | ApiError> {
    const params = this.serialize()

    const urlResourceType = this._action.getResource().getName().replace(/.+\./, '').replace(/Resource/, '')

    let url = this._action.getApi().getBaseUrl() + '?' + urlResourceType + ':' + this._action.getName()

    if (this._params && this._params.id) {
      url += ':' + (this._params.id as string)
    }

    if (this._fields) {
      url += ':' + (Object.keys(this._fields).join(','))
    }

    const axiosResponse = axios.post(url, params)
      .then(result => {
        return new ApiResponse(this, result)
      })
      .catch((error: AxiosError) => {
        console.error(error)
        return new ApiError(this, error)
      })

    // this._lastRequest = request
    return axiosResponse
  }

  protected serialize (): object {
    return {
      resource: this._action.getResource().getName(),
      action: this._action.getName(),
      params: this._params,
      scopes: this._scopes,
      filters: this._filters,
      fields: this._fields,
      data: this._data
    }
  }
}
