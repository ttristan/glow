# Hourly PR review

For one hour, poll GitHub every minute for open PRs, including PRs already open at startup. Keep polling while reviews run, and finish any review already in progress when the hour ends.

Review sessions may run in parallel on different PRs. Each session chooses a short, readable reviewer name that is unique among active reviewers (for example, `amber-otter`) and uses the label `review-<name>` to identify its claim on a PR. Labels are visible markers, not atomic locks: two sessions can race to claim the same unclaimed PR. Do not treat labels as safe same-PR mutual exclusion when sessions may start concurrently.

For each PR, use one reviewer at a time. The label check is advisory and cannot prevent a simultaneous claim race:

1. Skip any PR with a `review-<name>` label. Report existing claims; do not assume an existing label means its reviewer has stopped. Sessions may proceed with other PRs that have no reviewer label.
2. Choose a readable reviewer name not already used by an active review, add `review-<name>` to the PR, and record the claim before starting a Terra High subagent. Renew the label at least once per minute by removing and reapplying it; its latest application time in the PR timeline is the heartbeat. If renewal fails or the claim is lost, stop work on that PR and report the claim's state.
3. Ask the subagent to review only P1 and P2 issues, resolve merge conflicts, and run relevant checks. If it finds issues, fix them and push the fixes, then start a fresh review on the updated head. A review that made fixes cannot authorize a merge. Each review must report READY with the exact reviewed head commit, or NOT READY with the reason. Do not report lower-priority findings.
4. If a review reports NOT READY, retry while the issue is resolvable, keeping the claim throughout. Stop and report an unresolvable blocker. Limit each PR to three review rounds per watch.
5. For READY, verify that the PR is still open, its head still matches the reviewed commit, and it has no unresolved conflicts. Merge using the reviewed commit as a precondition. If the head changes, review again within the three-round limit. If merging fails, report the blocker and do not bypass branch protections.
6. Remove only this session's `review-<name>` label after merging or stopping. If interrupted, remove it when possible and report any claim that remains. After a successful merge, delete the source branch only if no other open PR uses it, using an atomic expected-head precondition so a branch that advanced is retained. If the precondition cannot be enforced or deletion fails, report why the branch was retained.

A heartbeat older than five minutes indicates a potentially abandoned claim. Report it and have an operator verify that its reviewer and subagent have stopped before removing the label. Recheck the claim before removal; a stale timestamp alone cannot safely authorize reclaiming work. Once the claim is cleared, a session may start a review.

At the end, report reviewed, merged, and blocked PRs, along with stale or retained claims and branches.
