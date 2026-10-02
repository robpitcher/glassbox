<script lang="ts" generics="T extends string">
  interface Option {
    value: T;
    label: string;
  }

  interface Props {
    options: Option[];
    value: T;
    label: string;
    onchange?: (value: T) => void;
  }

  let { options, value = $bindable(), label, onchange }: Props = $props();

  function select(next: T) {
    value = next;
    onchange?.(next);
  }

  function onkeydown(event: KeyboardEvent) {
    const index = options.findIndex((option) => option.value === value);
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % options.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;
    else return;
    event.preventDefault();
    select(options[next].value);
    (event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
  }
</script>

<div class="segmented" role="group" aria-label={label} {onkeydown}>
  {#each options as option (option.value)}
    <button
      type="button"
      class:active={value === option.value}
      aria-pressed={value === option.value}
      onclick={() => select(option.value)}
    >{option.label}</button>
  {/each}
</div>

<style>
  .segmented {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 4px;
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    background: var(--surface-2);
  }

  button {
    min-height: 2rem;
    padding: 0.3rem 0.9rem;
    border: 0;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    font: inherit;
    font-size: 0.88rem;
    font-weight: 700;
    transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
  }

  button:hover {
    color: var(--text);
  }

  button.active {
    background: var(--accent-grad);
    color: var(--on-accent);
  }

  button:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 2px;
  }
</style>
