#!/data/data/com.termux/files/usr/bin/bash
# Setup Supabase Auth redirect URLs via Management API

TOKEN=$(cat ~/.skb-supabase-token 2>/dev/null || echo "")
REF=$(cat ~/.skb-supabase-ref 2>/dev/null || echo "")

if [ -z "$TOKEN" ] || [ -z "$REF" ]; then
  echo "❌ Token বা ref missing"
  exit 1
fi

API="https://api.supabase.com/v1/projects/$REF/config/auth"
SITE_URL="https://skbsakib500.github.io/skb-education-ecosystem/"
ALLOW_LIST="https://skbsakib500.github.io/skb-education-ecosystem/**,https://skbsakib500.github.io/skb-education-ecosystem/reset-password/,http://localhost:3000/**"

echo "🔧 Updating Supabase Auth URLs..."
echo "   Site URL: $SITE_URL"
echo "   Redirect URLs added"
echo ""

# Build JSON payload using jq
PAYLOAD=$(jq -n \
  --arg site "$SITE_URL" \
  --arg list "$ALLOW_LIST" \
  '{site_url: $site, uri_allow_list: $list}')

# PATCH request
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "$API" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$CODE" = "200" ]; then
  echo "✅ SUCCESS"
  echo ""
  echo "📋 Current config:"
  echo "$BODY" | jq '{site_url, uri_allow_list}' 2>/dev/null || echo "$BODY"
else
  echo "❌ Failed (HTTP $CODE)"
  echo ""
  echo "Response:"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  echo ""
  echo "⚠️  Alternative: চালান GET request verify করতে:"
  echo "curl -s -X GET \"$API\" -H \"Authorization: Bearer \$TOKEN\" | jq ."
  exit 1
fi
