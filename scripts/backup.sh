#!/usr/bin/env bash
set -euo pipefail
mkdir -p backups
TS=$(date +"%Y%m%d_%H%M%S")
npx supabase db dump --schema public > "backups/schema_${TS}.sql"
npx supabase db dump --data-only > "backups/data_${TS}.sql"
echo "Backups written to backups/"
