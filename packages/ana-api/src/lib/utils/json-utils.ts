export function toJsonString(obj: any, pretty = false): string {
  return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj)
}

export function toPrettyJsonString(obj: any): string {
  return toJsonString(obj, true)
}

export function parseJsonSafely<T>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString) as T
  } catch {
    return null
  }
}