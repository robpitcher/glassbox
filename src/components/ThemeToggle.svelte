<script lang="ts">
  import { onMount } from 'svelte';

  type Theme = 'light' | 'dark';

  let theme = $state<Theme>('dark');

  onMount(() => {
    const current = document.documentElement.dataset.theme;
    theme = current === 'light' ? 'light' : 'dark';
  });

  function setTheme(next: Theme) {
    theme = next;
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
  }
</script>

<div class="theme-toggle" role="group" aria-label="Theme">
  <button
    type="button"
    data-theme-option="light"
    aria-label="Use light theme"
    aria-pressed={theme === 'light'}
    onclick={() => setTheme('light')}
  >
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2.2M12 19.8V22M4.93 4.93l1.56 1.56M17.51 17.51l1.56 1.56M2 12h2.2M19.8 12H22M4.93 19.07l1.56-1.56M17.51 6.49l1.56-1.56"></path>
    </svg>
  </button>
  <button
    type="button"
    data-theme-option="dark"
    aria-label="Use dark theme"
    aria-pressed={theme === 'dark'}
    onclick={() => setTheme('dark')}
  >
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M18.2 15.9A7.4 7.4 0 0 1 8.1 5.8 7.4 7.4 0 1 0 18.2 15.9Z"></path>
    </svg>
  </button>
</div>

<style>
  .theme-toggle {
    display: inline-grid;
    justify-self: start;
    width: max-content;
    grid-template-columns: repeat(2, 32px);
    gap: 2px;
    height: 34px;
    padding: 3px;
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    background: var(--glass-track);
    box-shadow: var(--glass-track-shadow);
  }

  button {
    display: grid;
    place-items: center;
    width: 28px;
    height: 26px;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--muted);
    transition:
      background var(--dur) var(--ease),
      color var(--dur) var(--ease),
      box-shadow var(--dur) var(--ease);
  }

  button[data-theme-option='dark'] {
    background: var(--glass-pill);
    color: var(--on-accent);
    box-shadow: var(--glass-pill-shadow);
  }

  :global(:root[data-theme='light']) button[data-theme-option='dark'] {
    background: transparent;
    color: var(--muted);
    box-shadow: none;
  }

  :global(:root[data-theme='light']) button[data-theme-option='light'] {
    background: var(--glass-pill);
    color: var(--on-accent);
    box-shadow: var(--glass-pill-shadow);
  }

  svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
