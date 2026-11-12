# Hourly PR review

For one hour, poll GitHub every minute for open PRs, including PRs already open at startup. Keep polling while reviews run, and finish any review already in progress when the hour ends.

Use exactly one coordinator for the repository. Labels and their timeline events are not atomic locks: unique IDs and heartbeats do not make multiple coordinators safe. If there could be another coordinator, stop until it is known to have stopped, or use an external atomic lock or lease for the entire coordination period. Stop coordinating if that lock or lease is lost.

For each PR, run at most one review at a time:

1. Skip any PR with a `review-in-progress` or `review-in-progress/<ID>` label. Report existing claims; do not assume that an old label means its reviewer has stopped.
2. Give the attempt a unique ID, add `review-in-progress/<ID>`, and record its ownership before starting a Terra High subagent. Renew the label at least once per minute by removing and reapplying it; its latest application time in the PR timeline is the heartbeat. The brief gap during renewal is safe only under the single-coordinator or external-lock rule above. If renewal fails or the claim is lost, stop work on that PR and report the claim's state.
3. Ask the subagent to review only P1 and P2 issues, fix any it finds, resolve merge conflicts, run relevant checks, and push fixes to the PR branch. It must report READY with the exact reviewed head commit, or NOT READY with the reason. Do not report lower-priority findings.
4. If the subagent reports NOT READY, retry while the issue is resolvable, keeping the claim throughout. Stop and report a blocker that cannot be resolved; limit retries to three review rounds per PR in this watch.
5. For READY, verify that the PR is still open, its head still matches the reviewed commit, and it has no unresolved conflicts. Merge using the reviewed commit as a precondition. If the head changes, review again within the three-round limit. If merging fails, report the blocker and do not bypass branch protections.
6. Remove only this attempt's label after merging or stopping. If interrupted, remove it when possible and report any claim that remains. After a successful merge, delete the source branch only if no other open PR uses it, using an atomic expected-head precondition so a branch that advanced is retained. If the precondition cannot be enforced or deletion fails, report why the branch was retained.

A heartbeat older than five minutes, including the latest application of a legacy `review-in-progress` label, indicates a potentially abandoned claim. Report it and have an operator verify that its coordinator and subagent have stopped before removing it. Recheck the claim before removal; a stale timestamp alone cannot safely authorize reclaiming work. Once the claim is cleared, a coordinator may start a new attempt.

At the end, report reviewed, merged, and blocked PRs, along with stale or retained claims and branches.
