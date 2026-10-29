<script lang="ts">
  interface Props {
    /** Bold first phrase. */
    lead: string;
    /** The rest of the one-sentence explanation. */
    text: string;
    /** Optional smaller second line. */
    note?: string;
  }

  let { lead, text, note }: Props = $props();
</script>

<div class="info" aria-live="polite" aria-atomic="true">
  <span class="info-icon" aria-hidden="true">i</span>
  <div>
    <p><strong>{lead}</strong> {text}</p>
    {#if note}<p class="info-note">{note}</p>{/if}
  </div>
</div>

<style>
  .info {
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;
    margin-top: 1.25rem;
    padding: 0.9rem 1.1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
  }

  .info-icon {
    display: inline-grid;
    flex: 0 0 auto;
    width: 1.6rem;
    height: 1.6rem;
    place-items: center;
    border-radius: var(--radius-pill);
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 0.85rem;
    font-weight: 800;
  }

  p {
    color: var(--muted);
    font-size: 0.95rem;
    line-height: 1.5;
  }

  strong {
    color: var(--text);
  }

  .info-note {
    margin-top: 0.3rem;
    font-size: 0.86rem;
  }
</style>
