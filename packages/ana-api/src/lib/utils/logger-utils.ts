import { BaseMessage } from '@langchain/core/messages'
import { toPrettyJsonString } from './json-utils.js'
import { fetchRedisClient } from '../clients/redis-client.js'

export interface Mermaidable {
  drawMermaid(): string
}

export enum LogEventType {
  String = 'String',
  JSON = 'JSON',
  Mermaid = 'Mermaid',
  Message = 'Message'
}

// Function overloads
export function log(gameId: string, prefix: string, text: string): void
export function log(gameId: string, prefix: string, graph: Mermaidable): void
export function log(gameId: string, prefix: string, messages: BaseMessage[]): void
export function log(gameId: string, prefix: string, message: BaseMessage): void
export function log(gameId: string, prefix: string, obj: Record<string, any>): void

// Implementation
export function log(gameId: string, prefix: string, content: any): void {
  // Handle different content types

  // String
  if (typeof content === 'string') {
    callLoggers(gameId, LogEventType.String, prefix, content)
    return
  }

  // Mermaid
  if (content && typeof content.drawMermaid === 'function') {
    callLoggers(gameId, LogEventType.Mermaid, prefix, content.drawMermaid())
    return
  }

  // BaseMessage
  if (content instanceof BaseMessage) {
    const metadata = {
      messageType: content.getType(),
      messageName: content.name || undefined
    }
    callLoggers(gameId, LogEventType.Message, prefix, content.content as string, metadata)
    return
  }

  // Array of BaseMessage
  if (Array.isArray(content) && content.length > 0 && content[0] instanceof BaseMessage) {
    content.forEach((message, index) => {
      const metadata = {
        messageType: message.getType(),
        messageName: message.name || undefined,
        messageIndex: index
      }
      callLoggers(gameId, LogEventType.Message, prefix, message.content as string, metadata)
    })
    return
  }

  // JSON object
  if (content && typeof content === 'object' && content.constructor === Object) {
    callLoggers(gameId, LogEventType.JSON, prefix, toPrettyJsonString(content))
    return
  }

  // Fallback for other types
  callLoggers(gameId, LogEventType.String, prefix, content.toString())
}

function callLoggers(
  gameId: string,
  contentType: LogEventType,
  prefix: string,
  content: string,
  metadata?: Record<string, any>
): void {
  logToConsole(gameId, contentType, prefix, content, metadata)
  logToStream(gameId, contentType, prefix, content, metadata)
}

function logToConsole(
  gameId: string,
  contentType: LogEventType,
  prefix: string,
  content: string,
  metadata: Record<string, any> = {}
): void {
  switch (contentType) {
    case LogEventType.String:
      console.log(`[${gameId}] ${prefix}: ${content}`)
      break
    case LogEventType.JSON:
      console.log(`[${gameId}] ${prefix}:`)
      console.log(content)
      break
    case LogEventType.Mermaid:
      console.log(`[${gameId}] ${prefix}:`)
      console.log(content)
      break
    case LogEventType.Message:
      const indexString = metadata.messageIndex !== undefined ? `[${metadata.messageIndex}]` : ''
      const typeString = `type=${metadata.messageType || 'unknown'}`
      const nameString = metadata.messageName ? `name=${metadata.messageName}` : ''

      console.log(`[${gameId}] ${prefix}`, indexString, typeString, nameString)
      console.log(content)
      break
  }
}

async function logToStream(
  gameId: string,
  contentType: LogEventType,
  prefix: string,
  content: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  const client = await fetchRedisClient()
  const key = `saved:game:${gameId}:log`

  switch (contentType) {
    case LogEventType.String:
    case LogEventType.Mermaid:
    case LogEventType.JSON:
      await client.xAdd(key, '*', { gameId, contentType, prefix, content })
      break
    case LogEventType.Message:
      let eventProperties: Record<string, string> = { gameId, contentType, prefix, content }
      if (metadata.messageIndex !== undefined) eventProperties.messageIndex = metadata.messageIndex.toString()
      eventProperties.messageType = metadata.messageType ?? 'unknown'
      eventProperties.messageName = metadata.messageName ?? 'none'
      await client.xAdd(key, '*', eventProperties)
      break
  }
}
