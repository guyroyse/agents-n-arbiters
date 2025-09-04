export interface VersionInfo {
  name: string
  version: string
  timestamp: string
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
