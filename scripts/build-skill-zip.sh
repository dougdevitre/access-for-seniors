#!/usr/bin/env bash
# Build dist/<skill-name>.zip, the file people upload to claude.ai
# (Customize > Skills > + > Create skill > Upload a skill).
#
# claude.ai rejects an upload when the skill folder name doesn't match the
# skill name, so the zip holds exactly one top-level folder named after the
# `name:` in SKILL.md, with only the files the skill reads at runtime.
#
# Safe to re-run: it rebuilds the zip from scratch every time, and the same
# commit always gives a byte-identical zip (sorted entries, fixed mtimes and
# modes, no extra file attributes).
#
# Usage: scripts/build-skill-zip.sh
# Exits 1 if the frontmatter fails validation, a required file is missing,
# or a references/ path named in SKILL.md is not in the zip.
set -euo pipefail

# What goes into the zip: SKILL.md, the references/ it loads on demand, the
# DISCLAIMER.md it points to, and LICENSE.md (the MIT notice travels with copies).
# docs/, tests/ and scripts/ are contributor files, not part of the runtime skill.
INCLUDE=(SKILL.md references DISCLAIMER.md LICENSE.md)
# Files that must be present.
REQUIRED=(SKILL.md DISCLAIMER.md LICENSE.md)
# Folders whose paths, when SKILL.md names them, must be in the zip.
LINKED_DIRS=(references)
# Fixed timestamp for every entry, so rebuilds are reproducible.
FIXED_TIME="2026-01-01 00:00:00"

die() { echo "build-skill-zip: error: $*" >&2; exit 1; }

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
validator=".github/scripts/check-skill-frontmatter.py"

for tool in zip unzip python3; do
  command -v "$tool" >/dev/null || die "$tool is not installed"
done
[ -f "$validator" ] || die "$validator is missing"
for f in "${REQUIRED[@]}"; do
  [ -f "$f" ] || die "$f is missing"
done

# 1. Validate the frontmatter and read the skill name.
python3 -I "$validator" SKILL.md || die "SKILL.md frontmatter failed validation"
name="$(python3 -I - SKILL.md <<'PY'
import re, sys, yaml
text = open(sys.argv[1], encoding="utf-8").read()
m = re.match(r"---\r?\n(.*?)\r?\n---\r?\n", text, re.S)
print((yaml.safe_load(m.group(1)) or {}).get("name", "") if m else "")
PY
)"
[[ "$name" =~ ^[a-z0-9-]+$ ]] || die "could not read a valid skill name from SKILL.md"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
stage="$tmp/stage/$name"
mkdir -p "$stage"

# 2. Stage a copy of the runtime files: no dotfiles, no PDFs, no symlinks.
for item in "${INCLUDE[@]}"; do
  [ -e "$item" ] || continue
  if [ -L "$item" ]; then die "$item is a symlink; the zip only takes regular files"; fi
  if [ -f "$item" ]; then
    cp "$item" "$stage/$item"
    continue
  fi
  while IFS= read -r -d '' path; do
    [ -L "$path" ] && die "$path is a symlink; the zip only takes regular files"
    mkdir -p "$stage/$(dirname "$path")"
    cp "$path" "$stage/$path"
  done < <(find "$item" -name '.*' -prune -o ! -iname '*.pdf' \( -type f -o -type l \) -print0)
done

# 3. Normalize modes and mtimes, then zip in sorted order.
find "$tmp/stage" -type d -exec chmod 755 {} +
find "$tmp/stage" -type f -exec chmod 644 {} +
find "$tmp/stage" -exec env TZ=UTC touch -h -d "$FIXED_TIME" {} +
(
  cd "$tmp/stage"
  find "$name" -print | LC_ALL=C sort | TZ=UTC zip -X -q -@ "$tmp/$name.zip"
)
mkdir -p dist
rm -f "dist/$name.zip"
mv "$tmp/$name.zip" "dist/$name.zip"
zipfile="dist/$name.zip"

# 4. Check the zip itself, the way claude.ai will see it.
check="$tmp/check"
mkdir -p "$check"
unzip -q "$zipfile" -d "$check"
entries="$(unzip -Z1 "$zipfile")"

top="$(printf '%s\n' "$entries" | cut -d/ -f1 | sort -u)"
[ "$top" = "$name" ] || die "zip must hold one top-level folder named $name, found: $(echo $top)"

python3 -I "$validator" "$check/$top/SKILL.md" "$top" || die "the zipped SKILL.md failed validation"

for f in "${REQUIRED[@]}"; do
  [ -f "$check/$name/$f" ] || die "$f is missing from the zip"
done

if printf '%s\n' "$entries" | grep -E '(^|/)\.|(^|/)dist/|\.pdf$' >/dev/null; then
  die "zip contains files it must not: $(printf '%s\n' "$entries" | grep -E '(^|/)\.|(^|/)dist/|\.pdf$' | tr '\n' ' ')"
fi

dirs_re="$(IFS='|'; echo "${LINKED_DIRS[*]}")"
missing=0
while IFS= read -r ref; do
  [ -n "$ref" ] || continue
  ref="${ref%.}"
  if [[ "$ref" == */ ]]; then
    if [ -z "$(find "$check/$name/$ref" -type f 2>/dev/null | head -1)" ]; then
      echo "build-skill-zip: SKILL.md names $ref, but the zip has no files under it" >&2
      missing=1
    fi
  elif [ ! -f "$check/$name/$ref" ]; then
    echo "build-skill-zip: SKILL.md names $ref, but it is not in the zip" >&2
    missing=1
  fi
done < <(grep -oE "(^|[^A-Za-z0-9_./-])(\./)?($dirs_re)/[A-Za-z0-9._/-]*" SKILL.md \
           | sed -E "s#^[^A-Za-z0-9]*(\./)?##" | LC_ALL=C sort -u)
[ "$missing" -eq 0 ] || die "files named in SKILL.md are missing from the zip"

# 5. Report.
bytes="$(wc -c < "$zipfile" | tr -d ' ')"
sha="$(sha256sum "$zipfile" | cut -d' ' -f1)"
echo "Built $zipfile ($bytes bytes, sha256 $sha)"
echo "Files ($(printf '%s\n' "$entries" | grep -cv '/$')):"
printf '%s\n' "$entries" | grep -v '/$' | sed 's/^/  /'
