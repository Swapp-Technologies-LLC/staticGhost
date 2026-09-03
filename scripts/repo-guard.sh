#!/usr/bin/env bash
# repo-guard.sh — blocks license-restricted assets, private docs, and
# internal infrastructure details from entering the public repository.
#
# .gitignore only protects against accident. This protects against a
# contributor using "git add -f", or editing .gitignore in the same PR.
#
# Run locally:  ./scripts/repo-guard.sh
# Run in CI:    see .github/workflows/repo-guard.yml
#
# Exit 0 = clean, 1 = violation found.

set -uo pipefail
fail=0

say() { printf '%s\n' "$*"; }
err() { printf '::error::%s\n' "$*"; fail=1; }

say "== repo-guard =="

# ---------------------------------------------------------------------
# 1. License-restricted theme assets and archives
# ---------------------------------------------------------------------
if git ls-files | grep -E '^themes/|\.zip$'; then
  err "Commercial/theme assets must never be committed. ThemeForest and similar licenses do not permit redistribution."
else
  say "ok: no theme/zip assets tracked"
fi

# ---------------------------------------------------------------------
# 2. Private docs and internal strategy documents
# ---------------------------------------------------------------------
if git ls-files | grep -E '^private-docs/|^GROWTH_STRATEGY\.md$|^BUSINESS_MODEL_CANVAS\.md$|^PROJECT_RECAP_AND_LAUNCH_ROADMAP\.md$|^PROJECT_LESSONS_AND_UPDATES\.md$|^VALIDATION_TEST\.md$|^PROJECT_HANDOFF\.md$|^competitor_analysis\.md$'; then
  err "Internal strategy/private docs must not be tracked in the public repo. Untrack with: git rm --cached <file>"
else
  say "ok: no internal strategy docs tracked"
fi

# ---------------------------------------------------------------------
# 3. Internal infrastructure details and credential patterns
# ---------------------------------------------------------------------
if git grep -nIE '192\.168\.[0-9]{1,3}\.[0-9]{1,3}|10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|zettlab|BEGIN [A-Z ]*PRIVATE KEY|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk_live_[A-Za-z0-9]{20,}' -- . ':!scripts/repo-guard.sh' ':!.github/workflows/repo-guard.yml' ':!*.svg'; then
  err "Internal IP/hostname or credential pattern found in tracked files. Scrub before merging."
else
  say "ok: no internal infra details or credential patterns"
fi

# ---------------------------------------------------------------------
# 4. Advisory: absolute claims that have caused compliance problems
#    Warn only — does not fail the build.
# ---------------------------------------------------------------------
say ""
say "-- advisory: review these claims against the legal sweep --"
git grep -nIE '100% (secure|production ready|test coverage|Local Privacy)|zero telemetry|DDoS-Proof|military.grade|Affiliate Compliance|WebCrypto' -- '*.md' '*.html' ':!scripts/repo-guard.sh' || say "(none found)"

say ""
if [ "$fail" -ne 0 ]; then
  say "repo-guard FAILED"
  exit 1
fi
say "repo-guard passed"
