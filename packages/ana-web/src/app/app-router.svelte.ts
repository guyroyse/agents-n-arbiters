export enum Route {
  Welcome = 'welcome',
  NewGame = 'new-game',
  Load = 'load',
  Game = 'game'
}

export default class AppRouter {
  static #instance: AppRouter
  #currentRoute = $state<Route>(Route.Welcome)

  private constructor() {}

  static get instance() {
    return this.#instance ?? (this.#instance = new AppRouter())
  }

  get currentRoute() {
    return this.#currentRoute
  }

  routeToWelcome() {
    this.#currentRoute = Route.Welcome
  }

  routeToNewGame() {
    this.#currentRoute = Route.NewGame
  }

  routeToGame() {
    this.#currentRoute = Route.Game
  }

  routeToLoad() {
    this.#currentRoute = Route.Load
  }
}
