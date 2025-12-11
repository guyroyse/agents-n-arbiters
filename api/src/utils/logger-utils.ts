import { GameLog } from '@domain/game-log.js'

export interface Mermaidable {
  drawMermaid(): string
}

export enum LogEventType {
  String = 'String',
  JSON = 'JSON',
  Mermaid = 'Mermaid'
}

// Function overloads
export function log(gameId: string, prefix: string, text: string): void
export function log(gameId: string, prefix: string, graph: Mermaidable): void
export function log(gameId: string, prefix: string, obj: Record<string, any>): void

// Implementation
export function log(gameId: string, prefix: string, content: any): void {
  // Handle different content types

  if (isMermaidable(content)) {
    callLoggers(gameId, LogEventType.Mermaid, prefix, content.drawMermaid())
    return
  }

  if (isJsonable(content)) {
    callLoggers(gameId, LogEventType.JSON, prefix, JSON.stringify(content))
    return
  }

  if (isStringable(content)) {
    callLoggers(gameId, LogEventType.String, prefix, content.toString())
    return
  }

  // Fallback for null/undefined
  callLoggers(gameId, LogEventType.String, prefix, String(content))
}

function isMermaidable(content: any): content is Mermaidable {
  return content && typeof content.drawMermaid === 'function'
}

function isJsonable(content: any): boolean {
  return (
    content &&
    typeof content === 'object' &&
    (content.constructor === Object || Array.isArray(content) || typeof content.toJSON === 'function')
  )
}

function isStringable(content: any): boolean {
  return content !== undefined && content !== null && typeof content.toString === 'function'
}

function callLoggers(gameId: string, contentType: LogEventType, prefix: string, content: string): void {
  logToConsole(gameId, contentType, prefix, content)
  logToStream(gameId, contentType, prefix, content)
}

function logToConsole(gameId: string, contentType: LogEventType, prefix: string, content: string): void {
  switch (contentType) {
    case LogEventType.JSON:
      console.log(`[${gameId}] ${prefix}:`)
      console.log(content)
      break
    case LogEventType.Mermaid:
      console.log(`[${gameId}] ${prefix}:`)
      console.log(content)
      break
    default:
      console.log(`[${gameId}] ${prefix}: ${content}`)
      break
  }
}

async function logToStream(gameId: string, contentType: LogEventType, prefix: string, content: string): Promise<void> {
  await GameLog.append(gameId, contentType, prefix, content)
}
