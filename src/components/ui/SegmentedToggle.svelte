<script lang="ts" generics="T extends string">
  interface Props {
    options: readonly { id: T; label: string }[];
    value: T;
    onchange: (next: T) => void;
    /** Id of the visible label for this group, usually the "Show" label in the control bar. */
    labelledby?: string;
    label?: string;
    /** Equal-width buttons that fill the available width. */
    stretch?: boolean;
    /** Let options wrap onto a second row in narrow containers. */
    wrap?: boolean;
  }

  let { options, value, onchange, labelledby, label, stretch = false, wrap = false }: Props = $props();
</script>

<div class="segmented" class:stretch class:wrap role="group" aria-labelledby={labelledby} aria-label={labelledby ? undefined : label}>
  {#each options as option (option.id)}
    <button type="button" aria-pressed={value === option.id} onclick={() => onchange(option.id)}>
      {option.label}
    </button>
  {/each}
</div>

<style>
  .segmented {
    display: inline-flex;
    padding: 0.25rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    background: color-mix(in srgb, var(--bg) 60%, transparent);
  }

  .segmented.stretch {
    display: grid;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
  }

  button {
    padding: 0.5rem 1rem;
    border: 0;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--muted);
    font-size: 0.88rem;
    font-weight: 750;
    transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
  }

  button:hover {
    color: var(--text);
  }

  button:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 2px;
  }

  button[aria-pressed='true'] {
    background: var(--accent-grad);
    color: var(--on-accent);
  }

  @container (max-width: 600px) {
    .segmented.wrap {
      flex-wrap: wrap;
      border-radius: 1.25rem;
    }

    button {
      padding: 0.45rem 0.75rem;
      font-size: 0.82rem;
    }
  }
</style>
