#!/usr/bin/env bash
# Run typecheck + lint + test as one command. Fails OPEN until the Next.js app
# is scaffolded with matching npm scripts — never blocks you mid-sprint.
# Expected package.json scripts once scaffolded (see EXECUTION_PLAN.md §3e):
#   typecheck -> tsc --noEmit
#   lint      -> eslint .      (NOT `next lint` — removed in Next.js 16)
#   test      -> vitest run
set -uo pipefail
cd "$(dirname "$0")"

if [ ! -f package.json ]; then
  echo "verify: not configured yet (no package.json)"
  exit 0
fi

has_script() { node -e "process.exit(require('./package.json').scripts?.['$1']?0:1)" 2>/dev/null; }

ran=0
fail=0
for s in typecheck lint test; do
  if has_script "$s"; then
    ran=1
    echo "=== npm run $s ==="
    npm run "$s" --silent || fail=1
  fi
done

if [ "$ran" = 0 ]; then
  echo "verify: not configured yet (no typecheck/lint/test scripts)"
  exit 0
fi

exit "$fail"
