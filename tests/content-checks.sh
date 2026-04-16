#!/usr/bin/env bash
# Automated content assertions for the skill.
#
# These are the same checks documented in tests/manual-tests.md, but runnable
# so CI catches regressions when a reference file drifts.
#
# Exits 0 if all assertions pass, non-zero otherwise.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PASS=0
FAIL=0

# assert_grep <description> <pattern> <file>
# Fails if pattern is not found in file.
assert_grep() {
  local desc="$1" pat="$2" file="$3"
  if grep -qE "$pat" "$file" 2>/dev/null; then
    printf "  PASS  %s\n" "$desc"
    PASS=$((PASS+1))
  else
    printf "  FAIL  %s\n          pattern: /%s/\n          file:    %s\n" \
      "$desc" "$pat" "$file"
    FAIL=$((FAIL+1))
  fi
}

# assert_grep_count <description> <pattern> <file> <min>
# Fails if pattern occurs fewer than <min> times.
assert_grep_count() {
  local desc="$1" pat="$2" file="$3" min="$4"
  local n
  n=$(grep -cE "$pat" "$file" 2>/dev/null || true)
  if [[ "$n" -ge "$min" ]]; then
    printf "  PASS  %s (found %d, need ≥%d)\n" "$desc" "$n" "$min"
    PASS=$((PASS+1))
  else
    printf "  FAIL  %s (found %d, need ≥%d)\n          pattern: /%s/\n          file:    %s\n" \
      "$desc" "$n" "$min" "$pat" "$file"
    FAIL=$((FAIL+1))
  fi
}

echo "Module catalogue"
assert_grep_count "references/modules.md contains 28 numbered modules" \
  "^### Module [0-9]+:" references/modules.md 28
assert_grep "Module 4 is named Engagement Scoring" \
  "^### Module 4: Engagement Scoring" references/modules.md
assert_grep "Module 28 is Aging-Services Navigation" \
  "^### Module 28: Aging-Services Navigation" references/modules.md

echo
echo "Data models"
assert_grep "Resident interface exists" \
  "interface Resident " references/data-models.md
assert_grep "DynamoDB table name is AccessForSeniors" \
  "AccessForSeniors" references/data-models.md
# Explicit negative check (grep -E can't do PCRE lookahead)
if grep -q "ConnectionOS" references/data-models.md; then
  printf "  FAIL  data-models.md still references pre-rebrand name 'ConnectionOS'\n"
  FAIL=$((FAIL+1))
else
  printf "  PASS  No pre-rebrand 'ConnectionOS' name in data-models.md\n"
  PASS=$((PASS+1))
fi

echo
echo "Engagement scoring"
assert_grep "Green zone is 70+" \
  "Green.*70" references/engagement-scoring.md
assert_grep "Yellow zone is 40-69" \
  "Yellow.*40" references/engagement-scoring.md
assert_grep "Red zone is <40" \
  "Red.*(0–39|<40)" references/engagement-scoring.md
assert_grep "Scores are framed as signals, not diagnoses" \
  "connection signal" references/engagement-scoring.md
assert_grep "Never uses diagnostic language 'lonely'" \
  "NEVER SAY.*lonely" references/engagement-scoring.md

echo
echo "Security & retention"
assert_grep "Default conversation retention is 7 years" \
  "Conversations.*7 years" references/security.md
assert_grep "HIPAA is referenced" \
  "HIPAA" references/security.md
assert_grep "BAA requirement documented" \
  "BAA" references/security.md

echo
echo "Tech stack anchors"
assert_grep "Mobile uses React Native + Expo" \
  "React Native \+ Expo" references/mobile-app.md
assert_grep "Mobile uses Clerk" \
  "Clerk" references/mobile-app.md
assert_grep "Conversation engine uses Claude API" \
  "Claude API" references/conversation-engine.md

echo
echo "MCP tools"
assert_grep_count "At least 7 MCP tool schemas defined" \
  '"name": "[a-z_]+"' references/mcp-tools.md 7
for tool in get_resident log_interaction get_engagement_score send_alert \
            generate_outreach_message save_memory list_residents; do
  assert_grep "MCP tool '$tool' defined" \
    "\"name\": \"$tool\"" references/mcp-tools.md
done

echo
echo "Aging services"
assert_grep "OAA Title III-C1 (congregate meals)" \
  "III-C1" references/aging-services.md
assert_grep "Medicare Parts A–D covered" \
  "Part D" references/aging-services.md
assert_grep "Eldercare Locator phone number" \
  "1-800-677-1116" references/aging-services.md
assert_grep "988 Crisis Lifeline" \
  "988" references/aging-services.md

echo
echo "-----------------------------------------------------"
printf "Result: %d passed, %d failed\n" "$PASS" "$FAIL"
if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
exit 0
