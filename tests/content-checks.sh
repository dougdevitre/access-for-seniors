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

# assert_no_grep <description> <pattern> <file>
# Fails if pattern IS found in file (for retired names, numbers and claims).
assert_no_grep() {
  local desc="$1" pat="$2" file="$3"
  if grep -qE "$pat" "$file" 2>/dev/null; then
    printf "  FAIL  %s\n          found:   /%s/\n          file:    %s\n" \
      "$desc" "$pat" "$file"
    FAIL=$((FAIL+1))
  else
    printf "  PASS  %s\n" "$desc"
    PASS=$((PASS+1))
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
assert_grep "911 listed for immediate danger" \
  "Call 911" references/aging-services.md
assert_no_grep "Missouri Adult Abuse hotline not described as 24/7 (it is daily 7am-8pm)" \
  "392-0210 \(24/7\)" references/aging-services.md
assert_no_grep "Retired program names gone (SenioRx, CLAIM site claimmo.org)" \
  "SenioRx|claimmo\.org" references/aging-services.md

assert_grep "Initial Enrollment is a 7-month window" \
  "7-month window" references/aging-services.md
assert_grep "Medicare Advantage Open Enrollment Jan 1 – Mar 31 listed" \
  "Medicare Advantage Open Enrollment:\*\* Jan 1 – Mar 31" references/aging-services.md
assert_no_grep "Missouri section labelled 'Missouri only', not personal context" \
  "for Doug's context" references/aging-services.md
# Eldercare Locator hours (eldercare.acl.gov): Mon-Fri, 8am-9pm ET. Every line
# that gives the number must give the hours on that line or the next one.
for f in $(grep -l "677-1116" SKILL.md references/*.md docs/*.md); do
  missing=$(awk '/677-1116/ { if ($0 !~ /8am/ && $0 !~ /8 ?am to 9 ?pm/) { pending=FNR; next } }
                 pending { if ($0 !~ /8am/ && $0 !~ /8 ?am to 9 ?pm/) print pending; pending=0 }
                 END { if (pending) print pending }' "$f")
  if [[ -z "$missing" ]]; then
    printf "  PASS  %s\n" "Eldercare Locator hours given with the number: $f"
    PASS=$((PASS+1))
  else
    printf "  FAIL  %s\n          lines:   %s\n" \
      "Eldercare Locator hours given with the number: $f" "$(echo $missing)"
    FAIL=$((FAIL+1))
  fi
done
assert_grep "Navigation replies in the person's language, with Spanish 988" \
  "Reply in the person's language.*988 and press 2" references/aging-services.md

echo
echo "Language and framing"
assert_grep "Companion replies in the resident's language" \
  "Reply in \{residentFirstName\}'s language" references/conversation-engine.md
assert_grep "Fixed safety replies are delivered in the resident's language" \
  "deliver every fixed reply in the resident's language" references/conversation-engine.md
assert_no_grep "SKILL.md does not claim to detect loneliness" \
  "detect senior" SKILL.md
assert_no_grep "Module 4 purpose is not loneliness detection" \
  "Loneliness and social isolation risk detection" references/modules.md
for f in SKILL.md references/security.md references/modules.md docs/glossary.md; do
  assert_no_grep "No unverified Stripe BAA requirement: $f" \
    "BAA (with|:).*Stripe|Stripe, Anthropic|Anthropic, Stripe" "$f"
done

echo
echo "Companion safety routing"
CE=references/conversation-engine.md
AL=references/alerts-system.md
FO=references/family-outreach.md
# Each emergency trigger is listed and maps to the 911 reply + tier3 alert.
for phrase in "fell" "can't breathe" "chest pain" "help me"; do
  assert_grep "Emergency trigger '$phrase' listed in the Emergency group" \
    "^\| Emergency \|.*\"$phrase\"" "$CE"
done
assert_grep "Emergency group raises emergency_keyword at tier3" \
  "^\| Emergency \|.*emergency_keyword.*tier3" "$CE"
assert_grep "Emergency reply tells the resident to call 911 or press the call button" \
  "Please call 911 now, or press your call button" "$CE"
# Each self-harm trigger is listed and maps to the 988 reply + tier3 alert.
for phrase in "hurt myself" "end it" "no reason to live" "better off without me"; do
  assert_grep "Self-harm trigger '$phrase' listed in the Self-harm group" \
    "^\| Self-harm \|.*\"$phrase\"" "$CE"
done
assert_grep "Self-harm group raises self_harm_keyword at tier3" \
  "^\| Self-harm \|.*self_harm_keyword.*tier3" "$CE"
assert_grep "Self-harm reply offers 988 and stays with the resident" \
  "You can call or text 988 right now — I can stay here with you" "$CE"
# Each abuse trigger is listed and maps to abuse_disclosure.
for phrase in "they hit me" "scared of" "won't let me"; do
  assert_grep "Abuse trigger '$phrase' listed in the Abuse group" \
    "^\| Abuse \|.*\"$phrase\"" "$CE"
done
assert_grep "Abuse group raises abuse_disclosure" \
  "^\| Abuse \|.*abuse_disclosure" "$CE"
assert_grep "Abuse reply gives 911 for immediate danger" \
  "If you are in danger right now, please call 911" "$CE"
assert_grep "Abuse reply gives the Missouri APS hotline with its real hours" \
  "1-800-392-0210, every day from 7am to 8pm" "$CE"
assert_grep "Abuse reply gives the Eldercare Locator for other states" \
  "Eldercare Locator at 1-800-677-1116" "$CE"
assert_no_grep "Retired reply: emergencies no longer answered with check-in only" \
  "or mention an emergency, respond with empathy and let them know" "$CE"
assert_no_grep "Retired rule: no blanket ban on pointing to crisis lines" \
  "Do NOT attempt to counsel, diagnose, or provide crisis intervention" "$CE"
assert_grep "Tier 3 is urgent with a minutes-scale target" \
  "^\| Tier 3 — Urgent \|.*5 minutes" "$AL"
assert_grep "Tier 3 target is configurable" \
  "configurable per tenant, 2–15 minutes" "$AL"
assert_grep "abuse_disclosure alert type defined" \
  "^\| \`abuse_disclosure\` \|" "$AL"
assert_grep "abuse_disclosure never goes to family" \
  "Never sent to.*family members, emergency contacts" "$AL"
assert_no_grep "Tier 3 no longer goes to all family" \
  "all family" "$AL"
assert_grep "Family outreach has an abuse-disclosure hold on highlights" \
  "Abuse-disclosure hold" "$FO"
assert_grep "abuse_disclosure in the data model" \
  "abuse_disclosure" references/data-models.md
assert_grep "abuse_disclosure in the send_alert MCP schema" \
  "\"abuse_disclosure\"" references/mcp-tools.md

echo
echo "Retired services and models"
for f in SKILL.md references/*.md docs/*.md; do
  assert_no_grep "No Amazon Pinpoint as a provider (end of support 2026-10-30): $f" \
    "Pinpoint \(SMS|Pinpoint/|/Pinpoint|Amazon Pinpoint or|SNS \+ Pinpoint|SNS · Pinpoint|Pinpoint --> |--> Pinpoint" "$f"
  assert_no_grep "No retired model ID claude-sonnet-4-20250514: $f" \
    "claude-sonnet-4-20250514" "$f"
done
assert_grep "Messaging stack names End User Messaging SMS" \
  "AWS::SMSVOICE::PhoneNumber" references/aws-deployment.md
assert_grep "SMS send permission is scoped, not wildcard" \
  "sms-voice:SendTextMessage" references/aws-deployment.md

echo
echo "-----------------------------------------------------"
printf "Result: %d passed, %d failed\n" "$PASS" "$FAIL"
if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
exit 0
