#!/usr/bin/env bash
# Build a .skill package from the repo root
# Usage: ./scripts/build-skill.sh [--skip-validate]
#
# Produces:
#   dist/access-for-seniors.skill          — latest build (stable filename)
#   dist/access-for-seniors-<version>.skill — version-stamped copy, where
#                                             version is read from CHANGELOG.md

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SKILL_NAME="access-for-seniors"
OUTPUT_DIR="dist"

# --- Pre-flight checks -----------------------------------------------------

if ! command -v zip >/dev/null 2>&1; then
  echo "ERROR: 'zip' is not installed. Install it first (e.g. apt install zip / brew install zip)." >&2
  exit 1
fi

# Skip validate only if explicitly opted out — broken packages are not worth shipping.
if [[ "${1:-}" != "--skip-validate" ]]; then
  echo "Validating skill before build..."
  if ! bash "$REPO_ROOT/scripts/validate.sh"; then
    echo "ERROR: validation failed; aborting build. Re-run with --skip-validate to bypass." >&2
    exit 1
  fi
fi

# Extract version from the first [X.Y.Z] header in CHANGELOG.md; fall back to "dev".
VERSION="$(grep -oE '^## \[[0-9]+\.[0-9]+\.[0-9]+\]' CHANGELOG.md 2>/dev/null \
          | head -1 \
          | sed -E 's/^## \[([0-9]+\.[0-9]+\.[0-9]+)\]/\1/')"
VERSION="${VERSION:-dev}"

# --- Stage and package -----------------------------------------------------

# mktemp avoids collisions between concurrent builds / multi-user hosts.
STAGING_DIR="$(mktemp -d -t "${SKILL_NAME}-build.XXXXXX")"
trap 'rm -rf "$STAGING_DIR"' EXIT

echo "Building Access For Seniors skill package (version: $VERSION)..."

mkdir -p "$STAGING_DIR/$SKILL_NAME"

# Skill payload: SKILL.md + references/ only. docs/, tests/, scripts/ are
# contributor assets, not part of the runtime skill.
cp SKILL.md "$STAGING_DIR/$SKILL_NAME/"
cp -r references "$STAGING_DIR/$SKILL_NAME/"

mkdir -p "$OUTPUT_DIR"

STABLE_FILE="$OUTPUT_DIR/${SKILL_NAME}.skill"
VERSIONED_FILE="$OUTPUT_DIR/${SKILL_NAME}-${VERSION}.skill"

# -q keeps output tidy; -X strips extra attributes that differ between hosts.
( cd "$STAGING_DIR" && zip -qrX "$REPO_ROOT/$STABLE_FILE" "$SKILL_NAME" -x "*.DS_Store" )
cp "$STABLE_FILE" "$VERSIONED_FILE"

echo "Built:"
ls -lh "$STABLE_FILE" "$VERSIONED_FILE"
