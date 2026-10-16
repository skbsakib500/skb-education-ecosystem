#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$(dirname "$0")/.."

TOKEN=$(cat ~/.skb-supabase-token 2>/dev/null || echo "")
REF=$(cat ~/.skb-supabase-ref 2>/dev/null || echo "")

if [ -z "$TOKEN" ] || [ -z "$REF" ]; then
  echo "❌ Token বা ref missing"
  exit 1
fi

API="https://api.supabase.com/v1/projects/$REF/database/query"
echo "🔌 Supabase Project: $REF"
echo ""

for f in db/migrations/*.sql; do
  echo "▶ $(basename "$f")"
  PAYLOAD=$(jq -Rs '{query: .}' < "$f")
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$API" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")
  CODE=$(echo "$RESP" | tail -n1)
  BODY=$(echo "$RESP" | sed '$d')
  if [ "$CODE" = "200" ] || [ "$CODE" = "201" ]; then
    echo "  ✅ OK"
  else
    echo "  ❌ HTTP $CODE"
    echo "  $BODY"
    exit 1
  fi
done

echo ""
echo "✅ All migrations complete!"
echo ""
echo "📊 Verify:"
bash "$(dirname "$0")/verify.sh"
