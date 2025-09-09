export function dateToTimestamp(isoDate: string): number {
  return Math.floor(new Date(isoDate).getTime() / 1000)
}

export function timestampToDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString()
}