#!/usr/bin/env bash
# Aderência aos design tokens do Prumo.
#
# Falha (exit 1) se um .scss de componente chumbar hex, ou se algum
# var(--token) apontar para um token que não existe em src/styles.scss.
#
# Rodar da raiz do repo Angular.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
STYLES="$ROOT/src/styles.scss"
COMPONENTS="$ROOT/src/app"

[ -f "$STYLES" ] || { echo "não achei $STYLES"; exit 2; }

fail=0

# ── 1. hex chumbado em .scss de componente ────────────────────────────────
hex=$(grep -rnE "#[0-9a-fA-F]{3,8}\b" "$COMPONENTS" --include=*.scss || true)
hex_count=$(printf '%s' "$hex" | grep -c . || true)

if [ "$hex_count" -gt 0 ]; then
  echo "FALHA: $hex_count hex chumbado em .scss de componente"
  echo "  (valor que não existe como token nasce no design system, não aqui)"
  printf '%s\n' "$hex" | sed "s|$ROOT/||" | sed 's/^/    /'
  fail=1
else
  echo "ok: nenhum hex chumbado em .scss de componente"
fi

# ── 2. tokens referenciados que não existem ───────────────────────────────
defined=$(grep -oE "^[[:space:]]+--[a-z0-9-]+:" "$STYLES" | tr -d ' :' | sort -u)
used=$(grep -rhoE "var\(--[a-z0-9-]+" "$COMPONENTS" --include=*.scss \
         | sed 's/var(//' | sort -u)

orphans=$(comm -13 <(printf '%s\n' "$defined") <(printf '%s\n' "$used"))
orphan_count=$(printf '%s' "$orphans" | grep -c . || true)

if [ "$orphan_count" -gt 0 ]; then
  echo "FALHA: $orphan_count token referenciado sem definição em src/styles.scss"
  echo "  (o CSS degrada em silêncio — o fallback dispara sempre, ou a regra some)"
  printf '%s\n' "$orphans" | sed 's/^/    /'
  fail=1
else
  echo "ok: todo var(--token) resolve"
fi

# ── resumo ────────────────────────────────────────────────────────────────
def_count=$(printf '%s\n' "$defined" | grep -c . || true)
use_count=$(printf '%s\n' "$used" | grep -c . || true)
echo "    $def_count tokens definidos, $use_count referenciados nos componentes"

exit $fail
