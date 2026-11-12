# Hourly PR review

- Poll open PRs every minute for one hour.
- Give each review attempt a unique ID and claim it with a `review-in-progress/<ID>` label before starting a Terra High subagent. Skip PRs with a fresh review claim.
- Renew each active claim at least once per minute by removing and reapplying its label; use the latest label application time from the PR timeline as its heartbeat. Stop work if the claim is lost.
- If a claim has not been renewed for five minutes, consider it abandoned. Recheck its latest heartbeat, remove the stale label, and start a new review with a new ID. Report stale claims, including legacy `review-in-progress` labels without an ID; use their latest application time for the same five-minute rule.
- The subagent must:
  - Review only for P1 and P2 issues.
  - Fix and push any findings, and resolve merge conflicts.
  - Mark the PR READY with the reviewed commit SHA, or finish NOT READY.
- If NOT READY, start another review round.
- If READY, merge only if the PR head still matches the reviewed SHA.
- Remove only the current attempt’s label when finished.
- Delete the PR's branch as cleanup.