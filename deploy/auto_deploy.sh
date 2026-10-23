#!/usr/bin/env bash
# CRM frontend — auto-deploy (cron poller). GitHub `main` → build → /home/ubuntu/crm/frontend/build
#
# Har daqiqa cron (ubuntu foydalanuvchisi):
#   * * * * * flock -n /tmp/crm-frontend-deploy.lock bash /home/ubuntu/crm_frontend/deploy/auto_deploy.sh >> /home/ubuntu/crm-deploy/frontend.log 2>&1
#
# Oqim: git fetch → yangi commit bo'lsa → npm ci + test + build (`CI=true` — ogohlantirish ham xato)
#       → build/ eski fayllar USTIGA nusxalanadi (ochiq tab'lardagi eski JS 404 bo'lmasin).
# Node 18+ serverda bo'lmasa — build `node:20-alpine` Docker konteynerida qilinadi.
# Build o'tmasa sayt eski holicha qoladi; commit `.deploy_failed` ga yoziladi (keyingi push'gacha).
# Qo'lda: `bash deploy/auto_deploy.sh --force`.
set -uo pipefail

SRC_DIR="${SRC_DIR:-/home/ubuntu/crm_frontend}"
BRANCH="${BRANCH:-main}"
TARGET_DIR="${TARGET_DIR:-/home/ubuntu/crm/frontend/build}"
SITE_URL="${SITE_URL:-https://crm.gennis.uz/}"
NODE_IMAGE="${NODE_IMAGE:-node:20-alpine}"
MARKER="$SRC_DIR/.deployed"
FAILED="$SRC_DIR/.deploy_failed"
FORCE="${1:-}"

ts() { date -u +%FT%TZ; }
log() { echo "$(ts) $*"; }

# Butun oqim main() ichida: bash faylni oxirigacha o'qib oladi — deploy paytida
# `git reset` shu skriptning o'zini almashtirsa ham ishlayotgan nusxa buzilmaydi.
main() {
    cd "$SRC_DIR" || { log "SRC_DIR topilmadi: $SRC_DIR"; exit 1; }
    git fetch --quiet origin "$BRANCH" || { log "fetch FAILED"; exit 0; }

    target=$(git rev-parse "origin/$BRANCH")
    last=$(cat "$MARKER" 2>/dev/null || echo none)
    if [ "$FORCE" != "--force" ]; then
        [ "$target" = "$last" ] && exit 0
        [ "$target" = "$(cat "$FAILED" 2>/dev/null)" ] && exit 0
    fi

    log "=== DEPLOY ${last:0:7} -> ${target:0:7}: $(git log -1 --format=%s "$target")"
    git reset --quiet --hard "$target"

    BUILD_CMD="npm ci --no-audit --no-fund && CI=true npx react-scripts test --watchAll=false && CI=true npm run build"
    node_major=$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/')
    if [ -n "$node_major" ] && [ "$node_major" -ge 18 ]; then
        log "build: host node v$node_major"
        bash -c "$BUILD_CMD" > /tmp/crm-frontend-build.log 2>&1
    else
        log "build: docker $NODE_IMAGE"
        docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -v "$SRC_DIR":/app -w /app "$NODE_IMAGE" \
            sh -c "$BUILD_CMD" > /tmp/crm-frontend-build.log 2>&1
    fi
    status=$?

    if [ $status -ne 0 ] || [ ! -f build/index.html ]; then
        tail -30 /tmp/crm-frontend-build.log
        echo "$target" > "$FAILED"
        log "BUILD FAILED — sayt eski holicha qoldi"
        exit 0
    fi

    mkdir -p "$TARGET_DIR"
    cp -r build/. "$TARGET_DIR"/
    # 30 kundan eski hash'li fayllarni tozalash (yangilari va index.html qoladi)
    find "$TARGET_DIR/static" -type f -mtime +30 -delete 2>/dev/null || true

    echo "$target" > "$MARKER"
    rm -f "$FAILED"
    want=$(grep -o 'static/js/main\.[a-z0-9]*\.js' build/index.html | head -1)
    got=$(curl -s --max-time 10 "$SITE_URL" | grep -o 'static/js/main\.[a-z0-9]*\.js' | head -1)
    log "=== DONE ${target:0:7} — build: $want, sayt: ${got:-?}"
}

main "$@"
