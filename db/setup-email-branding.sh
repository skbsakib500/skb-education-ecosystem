#!/data/data/com.termux/files/usr/bin/bash
# SKB Email Branding — Custom Templates via Management API

TOKEN=$(cat ~/.skb-supabase-token 2>/dev/null || echo "")
REF=$(cat ~/.skb-supabase-ref 2>/dev/null || echo "")

if [ -z "$TOKEN" ] || [ -z "$REF" ]; then
  echo "❌ Token বা ref missing"
  exit 1
fi

API="https://api.supabase.com/v1/projects/$REF/config/auth"

echo "🎨 Updating SKB email branding..."
echo ""

# ── SKB Email Wrapper (Header + Footer) ──
BRAND_HEADER='<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(16,100,60,0.08)"><div style="background:linear-gradient(135deg,#10b981,#14b8a6);padding:24px;text-align:center"><div style="display:inline-block;width:56px;height:56px;border-radius:16px;background:white;line-height:56px;text-align:center;font-weight:bold;font-size:20px;color:#10b981;margin-bottom:12px">SKB</div><div style="color:white;font-size:18px;font-weight:600">SKB Education Ecosystem</div><div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px">জ্ঞানের ইকোসিস্টেম</div></div>'

BRAND_FOOTER='<div style="padding:24px;background:#f6fbf8;border-top:1px solid #eef6f0;text-align:center"><div style="color:#5a7465;font-size:12px;line-height:1.6">SKB Education Ecosystem<br/>Schools · Colleges · Coaching Centers<br/><br/>© 2025 SKB Education<br/><a href="https://skbsakib500.github.io/skb-education-ecosystem/" style="color:#10b981;text-decoration:none;font-weight:500">skbsakib500.github.io/skb-education-ecosystem</a></div></div></div>'

# ── Password Recovery ──
RECOVERY_SUBJECT="[SKB] Reset your password · পাসওয়ার্ড রিসেট"
RECOVERY_HTML="${BRAND_HEADER}<div style=\"padding:32px 28px\"><h2 style=\"color:#0f2218;font-size:22px;margin:0 0 8px;font-weight:600\">Reset your password</h2><p style=\"color:#5a7465;font-size:14px;line-height:1.6;margin:0 0 20px\">আমরা আপনার password reset করার জন্য request পেয়েছি। নিচের button-এ click করে নতুন password দিন।</p><div style=\"text-align:center;margin:28px 0\"><a href=\"{{ .ConfirmationURL }}\" style=\"display:inline-block;background:linear-gradient(135deg,#10b981,#14b8a6);color:white;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:600;font-size:15px\">Reset Password →</a></div><p style=\"color:#8aa195;font-size:12px;line-height:1.6;margin:20px 0 0\">এই link 24 ঘণ্টা valid থাকবে। আপনি যদি request না করে থাকেন, এই email ignore করুন।</p><p style=\"color:#8aa195;font-size:12px;line-height:1.6;margin:12px 0 0\">Support: <a href=\"mailto:msakibalmhamud5@gmail.com\" style=\"color:#10b981\">msakibalmhamud5@gmail.com</a></p></div>${BRAND_FOOTER}"

# ── Signup Confirmation ──
CONFIRM_SUBJECT="[SKB] Welcome to SKB Education · স্বাগতম"
CONFIRM_HTML="${BRAND_HEADER}<div style=\"padding:32px 28px\"><h2 style=\"color:#0f2218;font-size:22px;margin:0 0 8px;font-weight:600\">Welcome to SKB Education!</h2><p style=\"color:#5a7465;font-size:14px;line-height:1.6;margin:0 0 20px\">SKB Education Ecosystem-এ আপনাকে স্বাগতম। আপনার account confirm করতে নিচের button-এ click করুন।</p><div style=\"text-align:center;margin:28px 0\"><a href=\"{{ .ConfirmationURL }}\" style=\"display:inline-block;background:linear-gradient(135deg,#10b981,#14b8a6);color:white;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:600;font-size:15px\">Confirm Account →</a></div><p style=\"color:#8aa195;font-size:12px;line-height:1.6;margin:20px 0 0\">Confirm করার পর আপনি institution তৈরি করতে পারবেন, students/teachers যোগ করতে পারবেন।</p></div>${BRAND_FOOTER}"

# ── Magic Link ──
MAGIC_SUBJECT="[SKB] Sign in to SKB Education"
MAGIC_HTML="${BRAND_HEADER}<div style=\"padding:32px 28px\"><h2 style=\"color:#0f2218;font-size:22px;margin:0 0 8px;font-weight:600\">Sign in to SKB Education</h2><p style=\"color:#5a7465;font-size:14px;line-height:1.6;margin:0 0 20px\">আপনার account-এ login করতে নিচের link-এ click করুন।</p><div style=\"text-align:center;margin:28px 0\"><a href=\"{{ .ConfirmationURL }}\" style=\"display:inline-block;background:linear-gradient(135deg,#10b981,#14b8a6);color:white;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:600;font-size:15px\">Sign In →</a></div></div>${BRAND_FOOTER}"

# ── Invite ──
INVITE_SUBJECT="[SKB] You're invited to SKB Education"
INVITE_HTML="${BRAND_HEADER}<div style=\"padding:32px 28px\"><h2 style=\"color:#0f2218;font-size:22px;margin:0 0 8px;font-weight:600\">You're invited!</h2><p style=\"color:#5a7465;font-size:14px;line-height:1.6;margin:0 0 20px\">SKB Education Ecosystem-এ আপনাকে invitation পাঠানো হয়েছে। Accept করতে নিচের button-এ click করুন।</p><div style=\"text-align:center;margin:28px 0\"><a href=\"{{ .ConfirmationURL }}\" style=\"display:inline-block;background:linear-gradient(135deg,#10b981,#14b8a6);color:white;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:600;font-size:15px\">Accept Invitation →</a></div></div>${BRAND_FOOTER}"

# ── Email Change ──
CHANGE_SUBJECT="[SKB] Confirm your new email"
CHANGE_HTML="${BRAND_HEADER}<div style=\"padding:32px 28px\"><h2 style=\"color:#0f2218;font-size:22px;margin:0 0 8px;font-weight:600\">Confirm Email Change</h2><p style=\"color:#5a7465;font-size:14px;line-height:1.6;margin:0 0 20px\">নতুন email address confirm করুন।</p><div style=\"text-align:center;margin:28px 0\"><a href=\"{{ .ConfirmationURL }}\" style=\"display:inline-block;background:linear-gradient(135deg,#10b981,#14b8a6);color:white;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:600;font-size:15px\">Confirm New Email →</a></div></div>${BRAND_FOOTER}"

# Build payload using jq
PAYLOAD=$(jq -n \
  --arg rsub "$RECOVERY_SUBJECT" --arg rhtml "$RECOVERY_HTML" \
  --arg csub "$CONFIRM_SUBJECT" --arg chtml "$CONFIRM_HTML" \
  --arg msub "$MAGIC_SUBJECT" --arg mhtml "$MAGIC_HTML" \
  --arg isub "$INVITE_SUBJECT" --arg ihtml "$INVITE_HTML" \
  --arg esub "$CHANGE_SUBJECT" --arg ehtml "$CHANGE_HTML" \
  '{
    mailer_subjects_recovery: $rsub,
    mailer_templates_recovery_content: $rhtml,
    mailer_subjects_confirmation: $csub,
    mailer_templates_confirmation_content: $chtml,
    mailer_subjects_magic_link: $msub,
    mailer_templates_magic_link_content: $mhtml,
    mailer_subjects_invite: $isub,
    mailer_templates_invite_content: $ihtml,
    mailer_subjects_email_change: $esub,
    mailer_templates_email_change_content: $ehtml
  }')

echo "📤 Sending update request..."
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "$API" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$CODE" = "200" ]; then
  echo ""
  echo "✅ SUCCESS — সব email templates update হয়েছে!"
  echo ""
  echo "📋 Updated fields:"
  echo "$BODY" | jq '{
    recovery: .mailer_subjects_recovery,
    confirmation: .mailer_subjects_confirmation,
    magic_link: .mailer_subjects_magic_link,
    invite: .mailer_subjects_invite,
    email_change: .mailer_subjects_email_change
  }' 2>/dev/null
else
  echo ""
  echo "❌ Failed (HTTP $CODE)"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  exit 1
fi
