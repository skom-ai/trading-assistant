#!/usr/bin/env bash
# =====================================================================
# File: 00_run_all.sh
# Description: Postgres first-boot initializer. Applies every migration
#              (V*) then every seed (S*) in strict filename order against
#              the database created by the postgres image. Executed once
#              by docker-entrypoint-initdb.d on an empty data volume.
# Source: valtide-db/README.md
# Notes: Fails fast (set -euo pipefail). Re-running against a populated
#        volume is a no-op because the image only runs initdb.d on first
#        boot; the SQL itself is also idempotent (IF NOT EXISTS / ON CONFLICT).
# =====================================================================
set -euo pipefail

DB="${POSTGRES_DB:-valtide}"
USER="${POSTGRES_USER:-valtide}"
BASE_DIR="/valtide-sql"

log() { echo "[valtide-db-init] $*"; }

apply_dir() {
    local dir="$1" label="$2"
    if [[ ! -d "$dir" ]]; then
        log "WARN: ${label} directory ${dir} missing, skipping"
        return 0
    fi
    for f in $(ls "$dir"/*.sql 2>/dev/null | sort); do
        log "Applying ${label}: $(basename "$f")"
        psql -v ON_ERROR_STOP=1 --username "$USER" --dbname "$DB" -f "$f"
    done
}

log "Starting Valtide schema + seed initialization for db=${DB}"
apply_dir "${BASE_DIR}/migrations" "migration"
apply_dir "${BASE_DIR}/seeds" "seed"

# Grant the concrete login user membership in the least-privilege roles.
log "Granting role membership to login user ${USER}"
psql -v ON_ERROR_STOP=1 --username "$USER" --dbname "$DB" <<SQL
GRANT app_readwrite TO ${USER};
SQL

log "Initialization complete."
