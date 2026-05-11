#!/usr/bin/env bash
set -euo pipefail

# Run from archive root or from project root after unpacking archive.
# Usage from project root:
#   bash grideng-codex-integrated-plan/apply_to_project.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(pwd)"

if [ ! -d "$SCRIPT_DIR/codex" ]; then
  echo "ERROR: archive codex/ folder not found"
  exit 1
fi

mkdir -p "$PROJECT_ROOT/codex/prompts"
cp -R "$SCRIPT_DIR/codex/"* "$PROJECT_ROOT/codex/"

echo "Updated codex/IMPLEMENTATION_PLAN.md and codex/prompts/."
echo "Next: inspect codex/IMPLEMENTATION_PLAN.md, then start with prompts/10-01-model-load-types-comments.md"
