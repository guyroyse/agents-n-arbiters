import azureFunctions from '@azure/functions'

import { fetchGames } from './games/fetch-games.js'
import { createGame } from './games/create-game.js'
import { fetchGame } from './games/fetch-game.js'
import { fetchGameTurns } from './games/fetch-game-turns.js'
import { takeGameTurn } from './games/take-game-turn.js'
import { updateGameName } from './games/update-game-name.js'
import { deleteGame } from './games/delete-game.js'

const { app } = azureFunctions

app.http('fetchGames', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'games',
  handler: fetchGames
})

app.http('createGame', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'games',
  handler: createGame
})

app.http('fetchGame', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'games/{gameId}',
  handler: fetchGame
})

app.http('fetchGameTurns', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'games/{gameId}/turns',
  handler: fetchGameTurns
})

app.http('takeGameTurn', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'games/{gameId}/take-turn',
  handler: takeGameTurn
})

app.http('updateGameName', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'games/{gameId}/name',
  handler: updateGameName
})

app.http('deleteGame', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'games/{gameId}',
  handler: deleteGame
})
