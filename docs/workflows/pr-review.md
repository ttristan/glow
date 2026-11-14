# Hourly PR review

- Poll open PRs every minute for one hour, including PRs already open at startup. Finish active reviews when the hour ends.
- Use one coordinator per repository; labels are not atomic locks. If another coordinator may be running, stop or use an external lock, and stop if that lock is lost.
- Give each review a unique ID and apply `review-in-progress/<ID>` before starting a Terra High subagent. Skip PRs with any `review-in-progress` label.
- Renew the claim at least once per minute by removing and reapplying its label. Stop if renewal fails or the claim is lost.
- The subagent reviews P1/P2 issues only. If it finds issues, fix them, resolve conflicts, push fixes, then start a fresh review with a new subagent on the updated head. A review that made fixes cannot authorize a merge.
- Limit each PR to three review rounds. Report unresolvable blockers; merge only after a fresh review finds no issues to fix and reports READY with the exact reviewed commit.
- For READY, verify the PR is open, conflict-free, and still at the reviewed commit; merge with that SHA as a precondition. Re-review a changed head within the round limit; do not bypass branch protections.
- Remove only this attempt's label when finished. If interrupted, remove it when possible and report any remaining claim.
- Treat claims older than five minutes, including legacy `review-in-progress` labels, as potentially abandoned. Report them; remove only after an operator confirms coordinator and subagent stopped, then recheck the claim.
- After merging, delete the source branch only if no other open PR uses it, with its reviewed head as a precondition; otherwise retain and report it.
- Report reviewed, merged, and blocked PRs, plus stale claims and retained branches.
