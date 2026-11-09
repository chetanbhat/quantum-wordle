# Compatibility and release notes

## Classic contract

`src/constants/wordlist.ts` is unchanged. Its SHA-256 is fixed in the compatibility test. Both 314-word arrays were also compared with the JavaScript bundle served by the production site on 2026-11-09; both matched exactly.

The original local-time epoch (`January 1, 2022 00:00:00`), elapsed 86,400,000-millisecond days, offset of three, modulo ordering, accepted dictionary, six attempts, and quantum feedback are preserved. Calendar-day arithmetic would change the puzzle around daylight-saving transitions and must not replace this calculation. Existing streak semantics are preserved too: a recorded loss resets the streak; skipping a day does not introduce a new reset rule.

Classic remains the default. Fresh daily has separate progress and statistics. Practice never records daily statistics. Bonus is off by default and must be selected before a win; a win is recorded before offering exactly one additional guess. The second solution stays hidden until that turn is submitted or skipped. Bonus results never enter the six-guess histogram or shared classic score.

## Storage safety

The existing `gameState` and `gameStats` keys are read and validated, never rewritten or deleted. Reading, rendering, changing modes, or opening dialogs does not migrate saved progress. A valid completed legacy game is recognized without recording another result.

On the first classic action, the exact original strings are copied to `qwordle:backup:legacy:v1`. The current classic game, statistics, and bonus state are then committed together to `qwordle:v2:classic` using one atomic `localStorage.setItem`. Fresh and practice use `qwordle:v2:fresh` and `qwordle:v2:practice`. Each record retains the full puzzle identity and pair.

Web Locks serialize writes across tabs. The writer rereads current storage inside the lock and checks the record revision before committing. Stale tabs and expired daily puzzles cannot replace newer progress. Failed storage writes do not consume a guess or update the displayed statistics. Unsupported Web Locks block persistent play; practice can run in memory. Unreadable or unknown-version saves are kept intact, never replaced by empty statistics. Storage removal by the browser or user cannot be prevented by application code; download backups are available.

A legacy tab cannot participate in the new lock protocol. If it changes legacy data after a v2 save, the new reader stops and preserves both records instead of guessing how to merge streaks. Export a full backup before investigating such a conflict. Do not clear either save to dismiss the message.

## Transfers and backups

`/transfer` exports the original keys, v2 records, preferences, and immutable backup records. Transfer links are URL-encoded and should be treated as private. They are removed from the address bar on opening; analytics do not run on this route.

Opening a link performs no storage writes. The player reviews classic statistics and explicitly imports into an empty destination. Existing classic saves, including malformed ones, are never overwritten. The imported classic record is one atomic write; source data is archived first. Both legacy and v2 links are supported. Fresh/practice records are retained in the backup but are not imported. Conflicting source versions are rejected. A full JSON backup can be downloaded even when game records fail validation; preserve it for recovery rather than editing it by hand.

## Updating the fresh list

The first edition contains 365 disjoint, dictionary-valid pairs of common words, with no classic pair reused. Its contents are in `src/constants/freshPairs.json`; registration is in `FRESH_EDITIONS` in `src/lib/puzzles.ts`.

To publish a refresh:

1. Add a new JSON file and a new edition ID. Keep published files and IDs immutable.
2. Choose a `startsAt` puzzle number strictly in the future, allowing the new build to reach players before activation. Use the existing classic puzzle number, not a different date calculation.
3. Append the edition in ascending activation order. The latest eligible edition supplies fresh pairs; classic never consults this registry.
4. Validate five-letter dictionary words, disjoint letters, duplicate pairs, activation boundaries, and unchanged selection before the activation number. Add fixtures for the new edition.
5. Run the full validation suite and inspect the preview. Make the refresh a separate feature-branch change.

Practice samples the initial edition independently and avoids immediately repeating the same pair. Practice refresh does not alter daily puzzles.

## Verification

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run test:timezones
npm audit --audit-level=low
npm run build
npx playwright install --with-deps chromium firefox webkit
npm run test:e2e
```

The browser suite exercises the production build in Chromium, Firefox, WebKit, and a mobile Chromium viewport. Tests use synthetic saves. Coverage includes legacy in-progress and finished games, six-turn wins/losses, optional bonus success/failure, reloads, mode switching, practice reset, malformed data, quota failures, duplicate Enter, two-tab completion races, rollover, preferences, modal keyboard isolation, and transfer preview/import/refusal. Unit tests additionally cover missing Web Locks, unknown schemas, stale revisions, legacy-version conflicts, failed imports, and byte preservation.

The compatibility suite compares the original scheduler at 21,900 instants per time zone over 20 years in eight zones. It compares the original feedback for every accepted word. CI runs the same commands and uploads browser traces on failure. Browser emulation does not replace testing on physical iOS/Android devices before a public release.

## Deployment and rollback

The output stays `build/`, with SPA fallback for `/transfer`. Netlify settings are checked into `netlify.toml`; Docker uses the same build with an Nginx SPA fallback. Existing public `REACT_APP_*` name/analytics settings are accepted through an explicit allowlist. Preview and branch deployments disable analytics. No service worker or origin change is introduced.

Review and deploy the exact tested commit through the existing production hosting workflow. Before release, verify the branch preview on a physical phone and test importing synthetic legacy data on an isolated browser profile. Never use a real player's storage for automated tests. Keep the classic word-list checksum and all storage tests as release gates.

**Do not roll back to a build that predates v2 storage after players have used this release.** The old client cannot read new wins. A rollback must retain the v2 storage reader/writer and disable or revert only the affected feature/UI. The untouched legacy values are a historical recovery copy, not the latest statistics after v2 play. Do not copy them over a newer record. If a release incident occurs, preserve both formats, ship a compatible fix, and verify it with the same suite before deployment.

### Local verification record (2026-11-09)

- Clean `npm ci`, typecheck, formatting, production build, and npm audit: passed; zero reported vulnerabilities.
- Unit/component tests: 47 passed.
- Scheduler/feedback/edition compatibility: all seven tests passed in each of eight time zones (175,200 scheduler comparisons).
- Production-build browser suite: 44 passed across Chromium, Firefox, WebKit, and mobile Chromium emulation.
- Race, rollover, and sixth-turn bonus checks: 36 additional repeated browser executions passed during investigation.
- Mobile light/dark layouts inspected visually.
- Docker is unavailable on the local test host. CI builds and smoke-tests the production container, including `/transfer` fallback.
- Physical-device review and production deployment remain release steps; local validation does not perform either.
