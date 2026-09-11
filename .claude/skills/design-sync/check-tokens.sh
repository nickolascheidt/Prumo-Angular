#!/usr/bin/env bash
# Aderência aos design tokens do Prumo.
#
# Falha (exit 1) se um componente chumbar cor, ou se algum var(--token)
# apontar para um token que não existe em src/styles.scss.
#
# Varre .scss, .ts e .html. Os dois últimos entraram porque a versão que só
# olhava .scss dava "ok" com 36 hex escondidos em `styles: []` de componente
# standalone e em [style.color] de template — cor chumbada ali não herda a
# troca de token, e a tela fica para trás calada.
#
# Escapatória: `token-exempt` na mesma linha isenta. Serve para cor que é DADO
# (a cor que o usuário escolheu para a categoria, o placeholder do campo de
# cor), não decisão de design. Use com parcimônia e diga por quê.
#
# Rodar da raiz do repo Angular.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
STYLES="$ROOT/src/styles.scss"
COMPONENTS="$ROOT/src/app"

[ -f "$STYLES" ] || { echo "não achei $STYLES"; exit 2; }

fail=0

# Linhas de componente que carregam cor literal, menos as isentas e os specs.
#
# `token-exempt` isenta na própria linha ou na linha imediatamente acima. A
# segunda forma existe porque a linha culpada costuma já estar comprida, e um
# comentário arrastado para o fim dela é um comentário que ninguém lê — mesma
# convenção do `eslint-disable-next-line`.
scan() {
  grep -rnE --include=*.scss --include=*.ts --include=*.html \
       -B1 "$1" "$COMPONENTS" 2>/dev/null \
    | awk -v FS=":" '
        # grep -B1 marca a linha de contexto com "-" no lugar do ":" depois do
        # número. Guardamos a última linha vista, seja contexto ou acerto, para
        # saber se a isenção estava logo acima.
        {
          line = $0
          is_hit = (line ~ /^[^:]+:[0-9]+:/)
          if (is_hit && line !~ /token-exempt/ && prev !~ /token-exempt/) print line
          if (line != "--") prev = line
        }
      ' \
    | grep -v '\.spec\.ts:' \
    || true
}

report() {
  local title="$1" body="$2" hint="$3" okmsg="$4"
  local n
  n=$(printf '%s' "$body" | grep -c . || true)
  if [ "$n" -gt 0 ]; then
    echo "FALHA: $n $title"
    echo "  ($hint)"
    printf '%s\n' "$body" | sed "s|$ROOT/||" | sed 's/^/    /'
    fail=1
  else
    echo "ok: $okmsg"
  fi
}

# ── 1. hex chumbado em componente (.scss, .ts, .html) ─────────────────────
report "hex chumbado em componente" \
       "$(scan '#[0-9a-fA-F]{3,8}\b')" \
       "valor que não existe como token nasce no design system, não aqui" \
       "nenhum hex chumbado em componente"

# ── 2. rgb()/rgba() literal em componente ─────────────────────────────────
# O guard antigo não via isto, e foi assim que três gradientes roxos
# sobreviveram ao rebranding: rgba(102,126,234,.12) não casa com /#[0-9a-f]/.
# Branco e preto puros passam — são véu sobre superfície, não cor de marca.
rgba_hits=$(scan '\brgba?\([0-9]' \
  | grep -vE 'rgba?\(\s*255,\s*255,\s*255' \
  | grep -vE 'rgba?\(\s*0,\s*0,\s*0' || true)
report "rgb()/rgba() literal em componente" \
       "$rgba_hits" \
       "cor de marca em rgba não herda a troca de token; use var(--token)" \
       "nenhum rgb()/rgba() de marca em componente"

# ── 3. gradiente onde a identidade pede cor chapada ───────────────────────
# A direção 1c aposentou os cinco gradientes. Os tokens continuam existindo
# como cor chapada; gradiente novo em componente é regressão.
report "gradiente em componente" \
       "$(scan 'linear-gradient|radial-gradient')" \
       "a identidade Prumo aposentou gradiente — use cor chapada" \
       "nenhum gradiente em componente"

# ── 4. tokens referenciados que não existem ───────────────────────────────
defined=$(grep -oE "^[[:space:]]+--[a-z0-9-]+:" "$STYLES" | tr -d ' :' | sort -u)
used=$(grep -rhoE "var\(--[a-z0-9-]+" "$COMPONENTS" \
         --include=*.scss --include=*.ts --include=*.html \
         | sed 's/var(//' | sort -u)

orphans=$(comm -13 <(printf '%s\n' "$defined") <(printf '%s\n' "$used"))
report "token referenciado sem definição em src/styles.scss" \
       "$orphans" \
       "o CSS degrada em silêncio — o fallback dispara sempre, ou a regra some" \
       "todo var(--token) resolve"

# ── resumo ────────────────────────────────────────────────────────────────
def_count=$(printf '%s\n' "$defined" | grep -c . || true)
use_count=$(printf '%s\n' "$used" | grep -c . || true)
echo "    $def_count tokens definidos, $use_count referenciados nos componentes"

exit $fail
