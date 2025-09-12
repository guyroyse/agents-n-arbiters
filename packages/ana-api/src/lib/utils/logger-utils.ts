import { BaseMessage } from '@langchain/core/messages'
import { toPrettyJsonString } from './json-utils.js'

export function logMessages(prefix: string, messages: BaseMessage[]) {
  console.log(`${prefix} has ${messages.length} message(s):`)

  messages.forEach((message, index) => {
    const indexString = `[${index}]`
    const typeString = `type=${message.getType()}`
    const nameString = message.name ? `name=${message.name}` : ''

    console.log(indexString, typeString, nameString)
    console.log(message.content)
  })
}

export function logJson(prefix: string, obj: any) {
  console.log(`${prefix}:`)
  console.log(toPrettyJsonString(obj))
}

export function logWorkflow(prefix: string, workflow: any) {
  console.log(`${prefix}:`)
  try {
    const mermaidDiagram = workflow.getGraph().drawMermaid()
    console.log(mermaidDiagram)
  } catch (error) {
    console.log('Could not generate Mermaid diagram, trying ASCII...')
    try {
      const asciiDiagram = workflow.getGraph().drawAscii()
      console.log(asciiDiagram)
    } catch (asciiError) {
      console.log('Could not generate any diagram:', error)
    }
  }
}
