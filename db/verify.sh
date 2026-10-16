#!/data/data/com.termux/files/usr/bin/bash
TOKEN=$(cat ~/.skb-supabase-token)
REF=$(cat ~/.skb-supabase-ref)
API="https://api.supabase.com/v1/projects/$REF/database/query"

QUERY="select (select count(*) from information_schema.tables where table_schema='public') as tables, (select count(*) from pg_policies where schemaname='public') as policies, (select count(*) from storage.buckets) as buckets;"

PAYLOAD=$(printf '%s' "$QUERY" | jq -Rs '{query: .}')
curl -s -X POST "$API" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" | jq .
