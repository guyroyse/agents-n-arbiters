<script lang="ts">
  import AppRouter from '@app/app-router.svelte.ts'
  import LoadTemplateViewModel from './load-template-view-model.svelte.ts'
  import ConfirmationDialog from '@components/ConfirmationDialog.svelte'
  import ErrorDialog from '@components/ErrorDialog.svelte'

  const appRouter = AppRouter.instance
  const viewModel = new LoadTemplateViewModel()

  let showConfirmation = $state(false)

  function handleBack() {
    appRouter.routeToWelcome()
  }

  function handleLoadSample() {
    viewModel.loadSampleTemplate()
  }

  function handleClear() {
    viewModel.clearTemplate()
  }

  function handleSubmit(event: Event) {
    event.preventDefault()
    showConfirmation = true
  }

  async function handleConfirmLoad() {
    showConfirmation = false
    const success = await viewModel.loadTemplateData()
    if (success) {
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => viewModel.clearSuccess(), 3000)
    }
  }

  function handleCancelLoad() {
    showConfirmation = false
  }

  function handleRetry() {
    handleConfirmLoad()
  }

  function handleCancelError() {
    viewModel.clearError()
  }
</script>

<section class="flex-1 w-full max-w-6xl mx-auto flex flex-col space-y-6">
  <header class="flex items-center justify-between">
    <h2 class="text-2xl font-bold text-redis-white">Load World Template</h2>
    <button onclick={handleBack} class="text-redis-dusk-30 hover:text-redis-white transition-colors cursor-pointer">
      ← Back
    </button>
  </header>

  <!-- Warning Section -->
  <div class="bg-redis-midnight border border-redis-dusk-10 rounded-lg p-4">
    <div class="flex items-start gap-3">
      <span class="text-xl">⚠️</span>
      <div class="flex-1">
        <h3 class="text-redis-white font-semibold mb-1">Warning: Destructive Operation</h3>
        <p class="text-redis-dusk-30 text-sm">
          Loading a world template will <strong class="text-redis-white">PERMANENTLY DELETE ALL DATA</strong> in Redis, including
          all saved games, game history, and existing templates. This action cannot be undone.
        </p>
      </div>
    </div>
  </div>

  <!-- Success Message -->
  {#if viewModel.successMessage}
    <div class="bg-redis-midnight border border-redis-dusk-10 rounded-lg p-4">
      <div class="flex items-center gap-2 text-redis-white">
        <span>✅</span>
        <span>{viewModel.successMessage}</span>
      </div>
    </div>
  {/if}

  <!-- Validation Error -->
  {#if viewModel.validationError}
    <div class="bg-redis-midnight border border-redis-dusk-10 rounded-lg p-4">
      <div class="flex items-center gap-2 text-redis-white">
        <span>❌</span>
        <span>{viewModel.validationError}</span>
      </div>
    </div>
  {/if}

  <!-- Template Upload Section -->
  <div class="bg-redis-midnight border border-redis-dusk-10 rounded-lg p-6 flex-1 flex flex-col overflow-hidden">
    <form onsubmit={handleSubmit} class="flex flex-col flex-1 min-h-0">
      <div class="flex-1 flex flex-col mb-4 min-h-0">
        <label for="template-data" class="block text-redis-white font-semibold mb-2">Template JSON Data</label>
        <textarea
          id="template-data"
          bind:value={viewModel.templateJson}
          disabled={viewModel.isLoading}
          class="flex-1 bg-redis-dusk border border-redis-dusk-10 text-redis-white px-3 py-2 rounded focus:border-redis-dusk-30 focus:outline-none font-mono text-sm disabled:opacity-50 resize-none"
          placeholder="Paste your world template JSON here..."
          required
        ></textarea>
        <p class="text-redis-dusk-30 text-sm mt-2">
          Expected format: <code class="text-redis-dusk-10">{'{ "player": {...}, "entities": [...] }'}</code>
        </p>
      </div>

      <div class="flex gap-4">
        <button
          type="submit"
          disabled={viewModel.isLoading}
          class="bg-redis-dusk hover:bg-redis-dusk-70 border-2 border-redis-dusk-10 text-redis-white font-bold text-lg tracking-wide py-4 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg"
        >
          {viewModel.isLoading ? 'Loading...' : 'Load Template'}
        </button>

        <button
          type="button"
          onclick={handleLoadSample}
          disabled={viewModel.isLoading}
          class="border-2 border-redis-dusk-10 hover:bg-redis-dusk text-redis-dusk-10 hover:text-redis-white font-bold text-lg tracking-wide py-4 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50 cursor-pointer shadow-md"
        >
          Load Sample
        </button>

        <button
          type="button"
          onclick={handleClear}
          disabled={viewModel.isLoading}
          class="border-2 border-redis-dusk-10 hover:bg-redis-dusk text-redis-dusk-10 hover:text-redis-white font-bold text-lg tracking-wide py-4 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50 cursor-pointer shadow-md"
        >
          Clear
        </button>
      </div>
    </form>
  </div>
</section>

<ConfirmationDialog
  show={showConfirmation}
  title="Load World Template"
  message="This will PERMANENTLY DELETE ALL DATA in Redis including all saved games, game history, and existing templates. This action cannot be undone. Are you sure you want to continue?"
  onConfirm={handleConfirmLoad}
  onCancel={handleCancelLoad}
/>

<ErrorDialog
  show={!!viewModel.error}
  title="Error Loading Template"
  message={viewModel.error || 'An unexpected error occurred'}
  onRetry={handleRetry}
  onCancel={handleCancelError}
/>
