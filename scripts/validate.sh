#!/usr/bin/env bash
# Validate skill structure and internal links
# Usage: ./scripts/validate.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

ERRORS=0

echo "Validating Access For Seniors skill..."

# Required files
for f in SKILL.md README.md LICENSE.md CHANGELOG.md; do
  if [[ ! -f "$f" ]]; then
    echo "FAIL: $f missing"
    ERRORS=$((ERRORS+1))
  fi
done

# Required reference files
REFS=(
  modules data-models security conversation-engine engagement-scoring
  mcp-tools auth billing multi-tenant aws-deployment cicd mobile-app gtm
  notifications alerts-system family-outreach message-generator memory-capture
  voice-interface caregiver-dashboard community-features analytics aging-services
)
for ref in "${REFS[@]}"; do
  if [[ ! -f "references/${ref}.md" ]]; then
    echo "FAIL: references/${ref}.md missing"
    ERRORS=$((ERRORS+1))
  fi
done

# Check SKILL.md frontmatter
if ! head -1 SKILL.md | grep -q "^---$"; then
  echo "FAIL: SKILL.md missing frontmatter"
  ERRORS=$((ERRORS+1))
fi
if ! grep -q "^name: access-for-seniors" SKILL.md; then
  echo "FAIL: SKILL.md missing 'name' field"
  ERRORS=$((ERRORS+1))
fi
if ! grep -q "^description:" SKILL.md; then
  echo "FAIL: SKILL.md missing 'description' field"
  ERRORS=$((ERRORS+1))
fi

# Check internal links in SKILL.md
BROKEN=""
while read -r ref; do
  if [[ ! -f "$ref" ]]; then
    BROKEN="${BROKEN}${ref}\n"
  fi
done < <(grep -oE 'references/[a-z-]+\.md' SKILL.md | sort -u)

if [[ -n "$BROKEN" ]]; then
  echo "FAIL: Broken references in SKILL.md:"
  printf "$BROKEN"
  ERRORS=$((ERRORS+1))
fi

if [[ $ERRORS -eq 0 ]]; then
  echo "PASS: All validations passed."
  exit 0
else
  echo "FAIL: $ERRORS error(s) found."
  exit 1
fi
