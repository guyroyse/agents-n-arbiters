<script lang="ts">
  import AppInfo from '@components/AppInfo.svelte'
  
  let name = 'World'
</script>

<main class="min-h-screen bg-redis-midnight flex items-center justify-center font-mono">
  <div class="bg-redis-dusk rounded-lg p-8 max-w-md w-full mx-4">
    <h1 class="text-3xl font-bold text-redis-white mb-4 text-center">
      Hello {name}!
    </h1>
    <p class="text-redis-dusk-30 text-center mb-6">
      Welcome to your Azure Static Web App
    </p>
    <div class="flex justify-center mb-6">
      <div class="bg-redis-hyper hover:bg-redis-deep-hyper text-redis-white font-semibold py-2 px-4 rounded-lg transition-colors">
        🚀 Ready for Azure
      </div>
    </div>
    
    <AppInfo />
  </div>
</main>
