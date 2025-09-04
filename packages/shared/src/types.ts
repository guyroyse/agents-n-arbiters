export interface VersionInfo {
  name: string
  version: string
  environment: string
}

export interface TakeTurnRequest {
  savedGameId: string
  command: string
}

export interface TakeTurnResponse {
  savedGameId: string
  command: string
  result: string
}

export interface GameHistoryEntry {
  command: string
  response: string
}
