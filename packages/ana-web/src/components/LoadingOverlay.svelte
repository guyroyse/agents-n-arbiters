<script lang="ts">
  interface Props {
    message?: string
  }

  let { message = 'Loading...' }: Props = $props()
</script>

<div class="absolute inset-0 bg-redis-midnight/70 flex items-center justify-center z-10 rounded-lg">
  <div class="bg-redis-midnight border border-redis-dusk-10 rounded-lg px-4 py-2">
    <div class="text-redis-dusk-30 flex items-center space-x-2">
      <div class="animate-spin">⏳</div>
      <span>{message}</span>
    </div>
  </div>
</div>