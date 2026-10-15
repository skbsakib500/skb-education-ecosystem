#!/data/data/com.termux/files/usr/bin/bash
TOKEN=$(cat ~/.skb-supabase-token)
REF=$(cat ~/.skb-supabase-ref)
API="https://api.supabase.com/v1/projects/$REF/database/query"

if [ -z "$1" ]; then
  echo "Usage: $0 '<SQL>'"
  exit 1
fi

PAYLOAD=$(printf '%s' "$1" | jq -Rs '{query: .}')
curl -s -X POST "$API" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$PAYLOAD" | jq .
