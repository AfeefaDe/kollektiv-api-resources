import Vue from 'vue'
import Router from 'vue-router'

import DefaultRouteComponent from './DefaultRouteComponent'
import { RouteDefinition } from './RouteDefinition'
import { RouteSetDefinition } from './RouteSetDefinition'

class RouteConfigPlugin {
  _pathDefinitionMap = {}

  _defaultComponents = {
    container: DefaultRouteComponent,
    list: DefaultRouteComponent,
    model: DefaultRouteComponent,
    detail: DefaultRouteComponent,
    edit: DefaultRouteComponent,
    new: DefaultRouteComponent
  }

  _routeDefinitions = []
  _config = {}

  _router = null
  _routes = []

  _promise = Promise.resolve(true)

  router (options) {
    Vue.use(Router)
    Vue.use(this)

    this._router = new Router(options)
    return this
  }

  install (Vue) {
    Object.defineProperty(Vue.prototype, '$routeDefinition', {
      get () {
        return (this.$props && this.$props.rcp_routeDefinition) ||
          (this.$attrs && this.$attrs.rcp_routeDefinition)
      }
    })

    Object.defineProperty(Vue.prototype, '$routeConfig', {
      get () {
        return (this.$routeDefinition && this.$routeDefinition.config) || {}
      }
    })
  }

  async getRouter () {
    await this._promise
    return this._router
  }

  defaultComponents (components = {}) {
    this._defaultComponents = {
      ...this._defaultComponents,
      ...components
    }
    return this
  }

  config (callback) {
    this._promise = this._promise.then(() => {
      // config is object -> make function
      if (typeof callback !== 'function') {
        const config = callback
        callback = () => config
      }

      // config is function
      callback = callback()

      // function is not async -> make async
      if (!(callback instanceof Promise)) {
        callback = Promise.resolve(callback)
      }

      return callback.then(config => {
        this._config = config
      })
    })
    return this
  }

  routes (callback) {
    this._promise = this._promise.then(() => {
      callback = callback({
        ROUTESET: this.routeSet,
        ROUTE: this.route
      })

      if (!(callback instanceof Promise)) {
        callback = Promise.resolve(callback)
      }

      return callback.then(routeOrRoutes => {
        this._routeDefinitions = Array.isArray(routeOrRoutes) ? routeOrRoutes : [routeOrRoutes]
        this._routeDefinitions.forEach(r => r.init(null, '', this._pathDefinitionMap))
        this._routes = this._routeDefinitions.map(r => r.toVue())

        for (const route of this._routes) {
          this._router.addRoute(route)
        }
      })
    })

    return this
  }

  async getRoutes () {
    await this._promise
    return this._routes
  }

  async dumpRoutes () {
    await this._promise
    for (const path in this._pathDefinitionMap) {
      const r = this._pathDefinitionMap[path]
      const whites = ' '.repeat(60 - path.length)
      const whites2 = ' '.repeat(40 - r.fullName.length)
      console.log('path:', path, whites, 'name:', r.fullName, whites2, 'parent:', r.parentPathDefinition && r.parentPathDefinition.fullName)
    }
  }

  route = (options) => {
    options.config = {
      ...this._config,
      ...options.config
    }
    return new RouteDefinition(options)
  }

  routeSet = (options) => {
    options.components = {
      ...this._defaultComponents,
      ...options.components
    }
    options.config = {
      ...this._config,
      ...options.config
    }
    return new RouteSetDefinition(options).getDefinitions()
  }
}

export const routeConfigPlugin = new RouteConfigPlugin()
