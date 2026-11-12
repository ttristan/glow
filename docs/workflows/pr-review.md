# Hourly PR review workflow

Use this prompt to start a one-hour review watch for `ttristan/glow`:

> For one hour, poll GitHub every minute for open pull requests, including those already open at startup. For each PR, run at most one review at a time. Add the `review-in-progress` label before starting a Terra High subagent; skip PRs that already have the label. A label alone is not an atomic lock: use only one coordinator for this repository, or use an external atomic lock before allowing multiple coordinators.
>
> Ask the subagent to review only P1 and P2 issues, fix any it finds, resolve merge conflicts, run relevant checks, and push fixes to the PR branch. The subagent must report either READY with the exact reviewed head commit, or NOT READY with the reason. Do not report lower-priority findings.
>
> If the subagent finishes without READY, start another Terra High review round. If a blocker cannot be resolved, stop retrying that PR and report it. Keep the label throughout review and retries. If the job is interrupted or cannot continue, remove the label when possible and report any stale claim; do not remove someone else's claim. An operator must inspect stale labels before clearing them.
>
> When the subagent reports READY, verify the PR is still open, the head still matches the reviewed commit, and it has no unresolved conflicts. Merge using the reviewed commit as a precondition. If the head changes, review again. If merging fails, report the blocker and do not bypass branch protections. Remove the label after merging or stopping work. Continue polling until the hour expires, then report reviewed, merged, and blocked PRs.

## Evolving this prompt

Change the prompt through a PR and test it on a small PR before relying on it. Keep a single coordinator unless a real atomic claim or lease is added; GitHub labels are visible status indicators, not locks. Add lease expiry, bounded retry policy, and persistent claim ownership before operating unattended across restarts.
