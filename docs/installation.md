# Installation Guide

## Option 1: Install as a Claude Skill (`.skill` file)

### Build the package

```bash
chmod +x scripts/build-skill.sh
./scripts/build-skill.sh
```

This creates `dist/access-for-seniors.skill`.

### Install in Claude.ai or Claude Desktop

1. Go to **Settings → Capabilities → Skills**
2. Click **Upload Skill**
3. Select `dist/access-for-seniors.skill`
4. The skill will be available in new conversations

## Option 2: Install as a local skill directory

If you're running Claude Code or have a skill directory mounted:

```bash
# Copy to your skill directory
cp -r access-for-seniors-enterprise /path/to/your/skills/access-for-seniors

# The directory must contain SKILL.md at the root
```

## Option 3: Use directly from GitHub

Clone the repo and reference it from your Claude environment:

```bash
git clone https://github.com/dougdevitre/access-for-seniors-enterprise.git
cd access-for-seniors-enterprise
./scripts/validate.sh
```

## Verifying the installation

Ask Claude something like:

- "What are the 28 modules in Access For Seniors?"
- "Show me the DynamoDB schema for Access For Seniors residents"
- "Design a feature for Access For Seniors Module 5 Alert Engine"

If the skill is working, Claude will reference the Access For Seniors architecture and modules rather than answering generically.

## Troubleshooting

**Skill doesn't trigger:**
- Verify `SKILL.md` frontmatter is valid YAML
- Check that the `description` field includes trigger phrases
- Run `./scripts/validate.sh` to verify structure

**Reference files not loading:**
- Reference files load on demand when Claude needs them
- The `SKILL.md` table in section 7 tells Claude which file to read for each topic
- If a reference is missing, validation will catch it
