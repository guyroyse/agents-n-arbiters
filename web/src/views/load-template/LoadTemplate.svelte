<script lang="ts">
  import AppRouter from '@app/app-router.svelte.ts'
  import LoadTemplateViewModel from './load-template-view-model.svelte.ts'
  import ConfirmationDialog from '@components/ConfirmationDialog.svelte'
  import ErrorDialog from '@components/ErrorDialog.svelte'

  const appRouter = AppRouter.instance
  const viewModel = new LoadTemplateViewModel()

  let fileInput: HTMLInputElement
  let showConfirmation = $state(false)
  let selectedFile = $state<File | null>(null)

  function handleBack() {
    appRouter.routeToWelcome()
  }

  function handleSelectFile() {
    fileInput.click()
  }

  async function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
      selectedFile = file
      showConfirmation = true
      // Reset the input so the same file can be selected again
      input.value = ''
    }
  }

  async function handleConfirmLoad() {
    showConfirmation = false
    if (selectedFile) {
      const success = await viewModel.loadTemplateFromFile(selectedFile)
      if (success) {
        // Auto-dismiss success message after 3 seconds
        setTimeout(() => viewModel.clearSuccess(), 3000)
      }
      selectedFile = null
    }
  }

  function handleCancelLoad() {
    showConfirmation = false
    selectedFile = null
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

  <!-- Template Selection Section -->
  <div
    class="bg-redis-midnight border border-redis-dusk-10 rounded-lg p-6 flex-1 flex flex-col items-center justify-center"
  >
    <div class="text-center space-y-6">
      <div class="text-redis-dusk-30">
        <p class="text-lg mb-2">Select a world template file to load</p>
        <p class="text-sm">
          Expected format: <code class="text-redis-dusk-10">{'{ "player": {...}, "entities": [...] }'}</code>
        </p>
      </div>

      <input
        bind:this={fileInput}
        type="file"
        accept=".json,application/json"
        onchange={handleFileChange}
        disabled={viewModel.isLoading}
        class="hidden"
      />

      <button
        onclick={handleSelectFile}
        disabled={viewModel.isLoading}
        class="bg-redis-dusk hover:bg-redis-dusk-70 border-2 border-redis-dusk-10 text-redis-white font-bold text-lg tracking-wide py-4 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg"
      >
        {viewModel.isLoading ? 'Loading...' : '📁 Select Template File'}
      </button>
    </div>
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
