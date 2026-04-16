#!/usr/bin/env bash
# Build a .skill package from the repo root
# Usage: ./scripts/build-skill.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SKILL_NAME="access-for-seniors"
OUTPUT_DIR="dist"
OUTPUT_FILE="${OUTPUT_DIR}/${SKILL_NAME}.skill"
STAGING_DIR="/tmp/${SKILL_NAME}-staging"

echo "Building Access For Seniors skill package..."

# Clean staging
rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR/$SKILL_NAME"

# Copy skill content
cp SKILL.md "$STAGING_DIR/$SKILL_NAME/"
cp -r references "$STAGING_DIR/$SKILL_NAME/"

# Create output dir
mkdir -p "$OUTPUT_DIR"

# Package as zip (.skill is a zip file)
cd "$STAGING_DIR"
zip -r "$REPO_ROOT/$OUTPUT_FILE" "$SKILL_NAME" -x "*.DS_Store"

cd "$REPO_ROOT"
echo "Built: $OUTPUT_FILE"
ls -lh "$OUTPUT_FILE"

# Cleanup staging
rm -rf "$STAGING_DIR"
