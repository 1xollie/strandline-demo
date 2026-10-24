# strandline-demo

The playground for the [Strandline](https://strandline.dev) real-agent demo.

**Strandline is the integration layer for parallel coding agents.** Teams now run several coding
agents (Claude Code, Codex, Cursor, open-source agents) on one repository at the same time. Each
agent's branch passes its own tests, but the *combination* breaks: text conflicts, build conflicts,
and the worst kind, semantic conflicts, where everything compiles and every branch is green and the
combined behaviour is still wrong. Strandline sits between the agents and `main`: it plans who
touches what, tells agents mid-task when a shared interface changes, merges syntax-aware, verifies
the *combined* result, sends a failure back to the agent that caused it, and lands the work with a
verification receipt.

## What this repository is

Just a tiny TypeScript billing service (`src/http-client.ts`, `src/export.ts`, their tests). It has
no dependencies and nothing to deploy. The demo points three real agents at it and lets them
collide. Every demo run creates its own branches and pull requests here and never touches `main`:

- `demo-<timestamp>-main`: the base the run lands onto
- `demo-<timestamp>/agent-client`, `.../agent-poller`, `.../agent-export`: one branch and one pull
  request per agent

## What the demo shows

Three headless agents (`claude -p --model haiku`, a small, cheap model) each get an ordinary task
in the same codebase, at the same time:

| agent | task |
|---|---|
| `agent-client` | change what `retries` means in the shared HTTP client (it becomes total attempts) |
| `agent-poller` | build a billing poller on top of that client, using `retries: 2` |
| `agent-export` | make the invoice CSV export spreadsheet-safe and add a JSON export |

The first two tasks collide *semantically*: the poller is written against the old meaning of
`retries`, so after the client changes it makes one request fewer than it promised. Git merges the
branches without a single conflict marker, and both branches pass their own tests. Only the
combination fails.

1. **Coordinate.** `agent-client` publishes the interface change to Strandline's contract log. The
   poller checks for contract changes before it commits and again before it calls itself done, so it
   learns about the change *while it is still working*, not after the merge.
2. **Verify.** Strandline builds, type-checks and tests the combination of all three branches.
3. **Return to author.** If the combination fails, the failure goes back to the agent that can fix
   it, as a task over MCP, not to a human.
4. **Repair, guarded.** If the author is silent or cannot fix it, a repair agent proposes a patch.
   Either way the fix is accepted only after Strandline's guards and a full re-verification pass.
5. **Land with a receipt.** The work lands and each pull request gets a verification receipt: which
   checks ran on the final state, the route taken (for example `failed → fixed by poller agent →
   passed`), and a digest.

A run takes about a minute and costs a few cents of model usage.

## Run it yourself

The demo is part of Strandline (`make demo-real`); see [strandline.dev](https://strandline.dev).
Pointing it at this repository needs a GitHub login with push access
(`GITHUB_DEMO_REPO=<owner>/strandline-demo`).

## License

Apache-2.0, like Strandline itself.
