import type { VersionInfo } from '@ana/shared'

export async function fetchVersionInfo(): Promise<VersionInfo> {
  const response = await fetch('/api/version')
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  return await response.json()
}
