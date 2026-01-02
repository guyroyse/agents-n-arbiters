// Error response type
export type ApiError = { error: string }

// Data types used in responses
export type SavedGameData = {
  gameId: string
  gameName: string
  lastPlayed: string
}

export type GameTurnData = {
  command: string
  reply: string
}

export type GameLogData = {
  id: string
  timestamp: number
  gameId: string
  contentType: string
  prefix: string
  content: string
  messageType?: string
  messageName?: string
  messageIndex?: number
}

export type VersionData = {
  name: string
  version: string
}

export type LoadTemplateData = {
  message: string
  timestamp: string
  entitiesLoaded: {
    player: number
    entities: number
  }
}
