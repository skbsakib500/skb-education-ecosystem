#!/data/data/com.termux/files/usr/bin/bash
cd "$(dirname "$0")/.."
TOKEN=$(cat ~/.skb-supabase-token)
REF=$(cat ~/.skb-supabase-ref)
API="https://api.supabase.com/v1/projects/$REF/database/query"
PAYLOAD=$(jq -Rs '{query: .}' < db/verify.sql)
curl -s -X POST "$API" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" | jq .
