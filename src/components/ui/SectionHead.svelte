<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** Section number shown in the badge. */
    n: number;
    /** Id for the h2, so the wrapping section can use aria-labelledby. */
    id: string;
    title: string;
    /** One line of explanation under the heading. */
    children?: Snippet;
  }

  let { n, id, title, children }: Props = $props();
</script>

<div class="section-head">
  <span class="section-badge" aria-hidden="true">{n}</span>
  <div>
    <h2 {id}>{title}</h2>
    {#if children}<p>{@render children()}</p>{/if}
  </div>
</div>

<style>
  .section-head {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .section-badge {
    display: inline-grid;
    flex: 0 0 auto;
    width: 2.25rem;
    height: 2.25rem;
    place-items: center;
    border-radius: var(--radius-pill);
    background: var(--accent-grad);
    color: var(--on-accent);
    font-weight: 800;
    box-shadow: 0 0.75rem 1.8rem color-mix(in srgb, var(--accent) 28%, transparent);
  }

  h2 {
    font-size: clamp(1.45rem, 3.4vw, 2rem);
    line-height: 1.05;
    letter-spacing: -0.035em;
  }

  p {
    max-width: 74ch;
    margin-top: 0.7rem;
    color: var(--muted);
    line-height: 1.55;
  }
</style>
