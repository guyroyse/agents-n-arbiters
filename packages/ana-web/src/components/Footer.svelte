<script lang="ts">
  import { onMount } from 'svelte'
  import type { VersionInfo } from '@ana/shared'
  import { fetchVersionInfo as fetchVersionInfoAPI } from '@lib/api'

  let versionInfo: VersionInfo | null = $state(null)
  let loading: boolean = $state(true)
  let error: string | null = $state(null)

  async function loadVersionInfo(): Promise<void> {
    try {
      versionInfo = await fetchVersionInfoAPI()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to fetch version info'
    } finally {
      loading = false
    }
  }

  onMount(() => loadVersionInfo())
</script>

<footer class="bg-redis-dusk border-t border-redis-dusk-10 p-4 text-xs text-center font-mono">
  {#if loading}
    <div class="text-redis-dusk-30">Loading version info...</div>
  {:else if error}
    <div class="text-redis-hyper">Unable to load version info</div>
  {:else if versionInfo}
    <div class="text-redis-dusk-30 space-x-4">
      <span>{versionInfo.name} v{versionInfo.version}</span>
      <span>•</span>
      <span class="text-redis-hyper">{versionInfo.environment}</span>
    </div>
  {/if}
</footer>
