#!/data/data/com.termux/files/usr/bin/bash
# SKB Project Name Branding

TOKEN=$(cat ~/.skb-supabase-token 2>/dev/null || echo "")
REF=$(cat ~/.skb-supabase-ref 2>/dev/null || echo "")

if [ -z "$TOKEN" ] || [ -z "$REF" ]; then
  echo "❌ Token বা ref missing"
  exit 1
fi

echo "🎨 Updating Supabase project branding..."
echo ""

# Change project name (appears in email headers)
PAYLOAD='{"name":"SKB Education"}'

API="https://api.supabase.com/v1/projects/$REF"

RESP=$(curl -s -w "\n%{http_code}" -X PATCH "$API" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$CODE" = "200" ] || [ "$CODE" = "201" ]; then
  echo "✅ Project name: SKB Education"
  echo ""
  echo "📋 Project info:"
  echo "$BODY" | jq '{id, name, region, created_at}' 2>/dev/null
else
  echo "⚠️  HTTP $CODE (project name change may be restricted)"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
fi

echo ""
echo "🔧 Verifying auth config..."

curl -s "$API/config/auth" -H "Authorization: Bearer $TOKEN" | jq '{
  site_url: .site_url,
  uri_allow_list: .uri_allow_list,
  smtp_sender_name: .smtp_sender_name,
  smtp_admin_email: .smtp_admin_email,
  mailer_subjects_recovery: .mailer_subjects_recovery
}' 2>/dev/null
