<script lang="ts">
  import { onMount } from 'svelte'
  import type { VersionInfo } from '@ana/shared'

  let versionInfo: VersionInfo | null = $state(null)
  let loading = $state(true)
  let error: string | null = $state(null)

  onMount(async () => {
    try {
      const response = await fetch('/api/version')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      versionInfo = await response.json()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to fetch version info'
    } finally {
      loading = false
    }
  })
</script>

<div class="bg-redis-dusk border border-redis-dusk-10 rounded-lg p-4 text-sm font-mono">
  <h3 class="text-redis-white font-semibold mb-2">API Information</h3>
  
  {#if loading}
    <div class="text-redis-dusk-30">Loading...</div>
  {:else if error}
    <div class="text-redis-hyper">Error: {error}</div>
  {:else if versionInfo}
    <div class="space-y-1 text-redis-dusk-30">
      <div><span class="text-redis-white">Name:</span> {versionInfo.name}</div>
      <div><span class="text-redis-white">Version:</span> {versionInfo.version}</div>
      <div><span class="text-redis-white">Environment:</span> 
        <span class="text-redis-hyper">{versionInfo.environment}</span>
      </div>
      <div><span class="text-redis-white">Last Updated:</span> {new Date(versionInfo.timestamp).toLocaleString()}</div>
    </div>
  {/if}
</div>