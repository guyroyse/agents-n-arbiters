<script lang="ts">
  import { onMount } from 'svelte'
  import FooterViewModel from './footer-view-model.svelte.ts'

  const viewModel = new FooterViewModel()

  onMount(async () => {
    await viewModel.loadVersionInfo()
  })
</script>

<footer class="bg-redis-dusk border-t border-redis-dusk-10 p-4 text-xs text-center font-mono">
  {#if viewModel.loading}
    <div class="text-redis-dusk-30">Loading version info...</div>
  {:else if viewModel.error}
    <div class="text-redis-hyper">Unable to load version info</div>
  {:else if viewModel.versionInfo}
    <div class="text-redis-dusk-30 space-x-4">
      <span>{viewModel.versionInfo.name} v{viewModel.versionInfo.version}</span>
      <span>•</span>
      <span class="text-redis-hyper">{viewModel.versionInfo.environment}</span>
    </div>
  {/if}
</footer>
