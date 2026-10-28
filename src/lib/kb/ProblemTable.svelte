<script lang="ts">
  // One row per problem inside a merged ticket, each linked to its own ticket.
  // Counts follow the desk's view (causes.ts, as exported): every report sits under its cause.
  // The desk's one-day-move notes get a row of their own too; those reports also stay counted
  // where the desk files them, so the rows can add up to more than the merged total.
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { causeOf, uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  type Problem = 'parser' | 'hint' | 'shift' | 'unplaced';
  let {
    ticket,
    repo,
    issues,
  }: { ticket: number; repo: string; issues: Partial<Record<Problem, number>> } = $props();

  const LABEL: Record<Problem, string> = {
    parser: 'Shared parser reads day-first dates month first',
    hint: 'booking-v3 form hints MM/DD/YYYY, reads day first',
    shift: 'Date moves by one day (time zone)',
    unplaced: 'No tenant on file, cause unknown',
  };

  const problemsOf = (r: Report): Problem[] => [
    causeOf(r, tenantOf(r)) ?? 'unplaced',
    ...(notes.oneDayMove.includes(r.id) ? (['shift'] as const) : []),
  ];

  const rows = $derived.by(() => {
    const unique = uniqueById(reports as Report[]);
    const merged = unique.filter((r) => r.mergedInto === ticket);
    const by = new Map<Problem, Report[]>();
    for (const r of merged) for (const p of problemsOf(r)) by.set(p, [...(by.get(p) ?? []), r]);
    const list = [...by.entries()]
      .map(([problem, rs]) => {
        const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
        const tagged = rs.filter((r) => r.meta.intakeTag === problem).length;
        return {
          problem,
          count: rs.length,
          tenants: new Set(rs.map((r) => r.tenant)).size,
          channels: [...new Set(rs.map((r) => r.channel))].sort().join(', '),
          tagged,
          seen: `${days[0]} to ${days[days.length - 1]}`,
        };
      })
      .sort((a, b) => b.count - a.count);
    const shiftUnder = list.find((x) => x.problem === 'shift')?.count ?? 0;
    return { rows: list, merged: merged.length, exported: (reports as Report[]).length, shiftUnder };
  });
</script>

<p class="sum">
  <strong>{rows.merged}</strong> reports merged into #{ticket} ({rows.exported} export rows, de-duplicated by id) ·
  <strong>{rows.rows.length}</strong> problems
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>channels</th><th>intake tag matches</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each rows.rows as r (r.problem)}
      <tr>
        <td><code>{r.problem}</code> {LABEL[r.problem]}</td>
        <td><strong>{r.count}</strong></td>
        <td>{r.tenants}</td>
        <td>{r.channels}</td>
        <td>{r.tagged} of {r.count}</td>
        <td>{r.seen}</td>
        <td>
          {#if issues[r.problem]}
            <a href="https://github.com/{repo}/issues/{issues[r.problem]}">{repo}#{issues[r.problem]}</a>
          {:else}none yet{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#if rows.shiftUnder}
  <p class="note">The {rows.shiftUnder} one-day moves are also counted under <code>parser</code>, where the desk files them by tenant.</p>
{/if}

<style>
  .sum { font-size: 1.1rem; }
  td:first-child code { margin-right: 0.35rem; }
  .note { color: var(--muted); font-size: 0.85em; }
</style>
