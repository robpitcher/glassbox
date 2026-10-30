<script lang="ts">
  import { onMount, tick } from 'svelte';

  type PagefindSearchResult = {
    id: string;
    data: () => Promise<{
      url: string;
      excerpt: string;
      meta?: {
        title?: string;
      };
    }>;
  };

  type Pagefind = {
    init?: () => Promise<void> | void;
    options?: (options: { baseUrl: string }) => void;
    search: (query: string) => Promise<{ results: PagefindSearchResult[] }>;
  };

  type Result = {
    id: string;
    title: string;
    excerpt: string;
    href: string;
  };

  const baseUrl = import.meta.env.BASE_URL || '/';
  const importBase = baseUrl.replace(/\/$/, '');
  const unavailableMessage = 'Search is available after building the site (pnpm build && pnpm preview).';

  let dialog: HTMLDialogElement;
  let input: HTMLInputElement;
  let query = $state('');
  let results = $state<Result[]>([]);
  let activeIndex = $state(-1);
  let isOpen = $state(false);
  let isLoading = $state(false);
  let isUnavailable = $state(false);
  let hasSearched = $state(false);
  let searchError = $state('');
  let lastFocused: HTMLElement | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let searchRun = 0;
  let pagefind: Pagefind | null = null;
  let pagefindLoad: Promise<Pagefind | null> | null = null;

  const activeOptionId = $derived(
    activeIndex >= 0 && results[activeIndex] ? `search-result-${results[activeIndex].id}` : undefined,
  );

  async function openSearch() {
    if (isOpen) {
      await tick();
      input?.focus();
      input?.select();
      return;
    }

    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    isOpen = true;

    if (!dialog.open) {
      dialog.showModal();
    }

    void loadPagefind();
    await tick();
    input?.focus();
  }

  function closeSearch() {
    if (dialog?.open) {
      dialog.close();
      return;
    }

    finishClose();
  }

  function finishClose() {
    if (!isOpen) return;

    isOpen = false;
    query = '';
    results = [];
    activeIndex = -1;
    hasSearched = false;
    searchError = '';
    lastFocused?.focus();
    lastFocused = null;
  }

  async function loadPagefind() {
    if (pagefind) return pagefind;

    if (import.meta.env.DEV) {
      isUnavailable = true;
      searchError = unavailableMessage;
      return null;
    }

    if (!pagefindLoad) {
      isLoading = true;
      pagefindLoad = import(/* @vite-ignore */ `${importBase}/pagefind/pagefind.js`)
        .then(async (module: Pagefind | { default?: Pagefind }) => {
          const loaded = 'search' in module ? module : module.default;

          if (!loaded) {
            throw new Error('Pagefind did not load');
          }

          loaded.options?.({ baseUrl });
          await loaded.init?.();
          pagefind = loaded;
          isUnavailable = false;
          searchError = '';
          return loaded;
        })
        .catch(() => {
          isUnavailable = true;
          searchError = unavailableMessage;
          return null;
        })
        .finally(() => {
          isLoading = false;
        });
    }

    return pagefindLoad;
  }

  function resultHref(url: string) {
    const base = baseUrl.replace(/\/$/, '');
    let path = url;

    if (typeof window !== 'undefined') {
      try {
        const parsed = new URL(url, window.location.origin);

        if (parsed.origin !== window.location.origin) {
          return url;
        }

        path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      } catch {
        path = url.startsWith('/') ? url : `/${url}`;
      }
    }

    if (!base) return path;

    while (path.startsWith(`${base}${base}/`)) {
      path = `${base}${path.slice((base + base).length)}`;
    }

    if (path === base || path.startsWith(`${base}/`)) {
      return path;
    }

    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }

  async function search(term: string) {
    const run = ++searchRun;
    const searcher = await loadPagefind();

    if (!searcher || run !== searchRun) return;

    isLoading = true;
    hasSearched = true;

    try {
      const response = await searcher.search(term);
      const nextResults = await Promise.all(
        response.results.slice(0, 8).map(async (item) => {
          const data = await item.data();

          return {
            id: item.id,
            title: data.meta?.title || data.url,
            excerpt: data.excerpt,
            href: resultHref(data.url),
          };
        }),
      );

      if (run !== searchRun) return;

      results = nextResults;
      activeIndex = nextResults.length ? 0 : -1;
    } catch {
      if (run !== searchRun) return;

      results = [];
      activeIndex = -1;
      searchError = 'Search could not load. Try refreshing the page.';
    } finally {
      if (run === searchRun) {
        isLoading = false;
      }
    }
  }

  function moveActive(direction: 1 | -1) {
    if (!results.length) return;

    activeIndex = (activeIndex + direction + results.length) % results.length;
  }

  function selectActive() {
    const result = results[activeIndex];

    if (!result) return;

    closeSearch();
    window.location.assign(result.href);
  }

  function handleInputKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectActive();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeSearch();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === dialog) {
      closeSearch();
    }
  }

  function isTypingTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;

    const tagName = target.tagName.toLowerCase();
    return (
      target.isContentEditable ||
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select'
    );
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      void openSearch();
      return;
    }

    if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isTypingTarget(event.target)) {
      event.preventDefault();
      void openSearch();
    }
  }

  onMount(() => {
    const openFromEvent = () => {
      void openSearch();
    };

    window.addEventListener('keydown', handleWindowKeydown);
    window.addEventListener('open-search', openFromEvent);

    return () => {
      window.removeEventListener('keydown', handleWindowKeydown);
      window.removeEventListener('open-search', openFromEvent);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  });

  $effect(() => {
    const term = query.trim();

    if (debounceTimer) clearTimeout(debounceTimer);

    if (!isOpen || !term) {
      results = [];
      activeIndex = -1;
      hasSearched = false;
      return;
    }

    debounceTimer = setTimeout(() => {
      void search(term);
    }, 150);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  });
</script>

<dialog
  class="search-dialog"
  bind:this={dialog}
  aria-labelledby="search-title"
  onclick={handleBackdropClick}
  onclose={finishClose}
  oncancel={closeSearch}
>
  <section class="search-panel" aria-describedby="search-help">
    <header class="search-header">
      <h2 id="search-title">Search Glassbox</h2>
      <kbd>Esc</kbd>
    </header>

    <label class="search-field" for="site-search">
      <svg class="search-icon" aria-hidden="true" viewBox="0 0 24 24">
        <path
          d="m20 20-4.6-4.6m2.1-5.1a7.2 7.2 0 1 1-14.4 0 7.2 7.2 0 0 1 14.4 0Z"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-width="1.8"
        />
      </svg>
      <span class="sr-only">Search topics</span>
      <input
        bind:this={input}
        bind:value={query}
        id="site-search"
        type="search"
        autocomplete="off"
        spellcheck="false"
        placeholder="Search topics"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={results.length > 0}
        aria-controls="search-results"
        aria-activedescendant={activeOptionId}
        onkeydown={handleInputKeydown}
      />
    </label>

    <div class="search-body">
      {#if isUnavailable}
        <p class="search-note">{searchError || unavailableMessage}</p>
      {:else if !query.trim()}
        <p class="search-note" id="search-help">Type to search topics</p>
      {:else if isLoading}
        <p class="search-note">Loading search…</p>
      {:else if results.length}
        <ul class="results" id="search-results" role="listbox" aria-label="Search results">
          {#each results as result, index}
            <li
              id={`search-result-${result.id}`}
              class:active={index === activeIndex}
              role="option"
              aria-selected={index === activeIndex}
            >
              <a
                href={result.href}
                onmouseenter={() => (activeIndex = index)}
                onclick={(event) => {
                  event.preventDefault();
                  closeSearch();
                  window.location.assign(result.href);
                }}
              >
                <span class="result-title">{result.title}</span>
                <span class="result-excerpt">{@html result.excerpt}</span>
              </a>
            </li>
          {/each}
        </ul>
      {:else if hasSearched}
        <p class="search-note">No results for “{query.trim()}”</p>
      {/if}
    </div>
  </section>
</dialog>

<style>
  :global(body:has(.search-dialog[open])) {
    overflow: hidden;
  }

  .search-dialog {
    width: min(640px, calc(100vw - 32px));
    max-width: none;
    margin: 12vh auto auto;
    padding: 0;
    border: 0;
    color: var(--text);
    background: transparent;
    font-family: var(--font-sans);
  }

  .search-dialog::backdrop {
    background: color-mix(in srgb, var(--bg) 76%, transparent);
    backdrop-filter: blur(14px);
  }

  .search-panel {
    overflow: hidden;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--surface-solid) 72%, transparent);
    -webkit-backdrop-filter: var(--glass-blur);
    backdrop-filter: var(--glass-blur);
    box-shadow: var(--shadow), 0 30px 80px rgba(0, 0, 0, 0.3);
  }

  .search-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px 0;
  }

  h2 {
    margin: 0;
    color: var(--muted);
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  kbd {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 0 9px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--muted);
    background: var(--surface);
    font-family: var(--font-mono);
    font-size: 0.72rem;
  }

  .search-field {
    display: grid;
    grid-template-columns: 24px 1fr;
    align-items: center;
    gap: 12px;
    margin: 16px 20px 18px;
    padding: 13px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface-2);
    color: var(--muted);
    transition:
      border-color var(--dur) var(--ease),
      background var(--dur) var(--ease);
  }

  .search-field:focus-within {
    border-color: var(--accent);
    background: var(--surface);
  }

  .search-icon {
    width: 22px;
    height: 22px;
  }

  input {
    min-width: 0;
    border: 0;
    outline: 0;
    color: var(--text);
    background: transparent;
    font: inherit;
    font-size: 1.04rem;
  }

  input::placeholder {
    color: var(--muted);
  }

  .search-body {
    min-height: 120px;
    border-top: 1px solid var(--border);
  }

  .search-note {
    margin: 0;
    padding: 28px 24px 34px;
    color: var(--muted);
    line-height: 1.6;
  }

  .results {
    display: grid;
    gap: 4px;
    max-height: min(54vh, 520px);
    margin: 0;
    padding: 10px;
    overflow-y: auto;
    list-style: none;
  }

  li {
    border-radius: var(--radius-sm);
  }

  a {
    display: grid;
    gap: 6px;
    padding: 14px;
    border-radius: var(--radius-sm);
    color: inherit;
    text-decoration: none;
    transition:
      background var(--dur) var(--ease),
      color var(--dur) var(--ease);
  }

  li.active a,
  a:hover,
  a:focus-visible {
    color: var(--text);
    background: var(--accent-soft);
    outline: none;
  }

  a:focus-visible {
    box-shadow: 0 0 0 2px var(--accent);
  }

  .result-title {
    font-weight: 760;
    line-height: 1.25;
  }

  .result-excerpt {
    color: var(--muted);
    font-size: 0.92rem;
    line-height: 1.5;
  }

  .result-excerpt :global(mark) {
    border-radius: var(--radius-sm);
    color: var(--text);
    background: var(--accent-soft);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (max-width: 430px) {
    .search-dialog {
      width: calc(100vw - 20px);
      margin-top: 10vh;
    }

    .search-header {
      padding-inline: 16px;
    }

    .search-field {
      margin-inline: 16px;
    }

    .results {
      max-height: 58vh;
    }
  }
</style>
