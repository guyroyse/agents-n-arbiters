<script lang="ts">
  import Header from '@components/header/Header.svelte'
  import Footer from '@components/footer/Footer.svelte'
  import Welcome from '@views/welcome/Welcome.svelte'
  import NewGame from '@views/new-game/NewGame.svelte'
  import Game from '@views/game/Game.svelte'
  import LoadGame from '@views/load-game/LoadGame.svelte'
  import AppRouter, { Route } from '@app/app-router.svelte.ts'
  import AppState from '@app/app-state.svelte.ts'

  const appRouter = AppRouter.instance
  const appState = AppState.instance
</script>

<Header />

<main class="flex-1 flex flex-col space-y-6">
  {#if appRouter.currentRoute === Route.Welcome}
    <Welcome />
  {:else if appRouter.currentRoute === Route.NewGame}
    <NewGame />
  {:else if appRouter.currentRoute === Route.Game && appState.currentGameId}
    <Game />
  {:else if appRouter.currentRoute === Route.Load}
    <LoadGame />
  {:else}
    <div>Unknown route</div>
  {/if}
</main>

<Footer />
