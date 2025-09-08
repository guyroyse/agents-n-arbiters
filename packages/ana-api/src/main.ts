import azureFunctions from '@azure/functions'

import { version } from './functions/version.js'
import { fetchGames, createGame, fetchGame, fetchGameTurns, takeGameTurn, updateGameName, deleteGame } from './functions/games.js'

const { app } = azureFunctions

app.http('version', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'version',
  handler: version
})

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
