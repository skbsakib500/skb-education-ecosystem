"use client";
import { QRCodeSVG } from "qrcode.react";

const TIERS: Record<string, any> = {
  bronze: {
    label: "Bronze", emoji: "🥉", tagline: "Foundation Member",
    gradient: "linear-gradient(135deg, #92400e 0%, #b45309 30%, #d97706 50%, #b45309 70%, #92400e 100%)",
    border: "#d97706", glow: "rgba(217,119,6,0.5)",
    accent: "#fef3c7", shine: "rgba(255,237,213,0.4)",
  },
  silver: {
    label: "Silver", emoji: "🥈", tagline: "Verified Member",
    gradient: "linear-gradient(135deg, #475569 0%, #64748b 30%, #94a3b8 50%, #64748b 70%, #475569 100%)",
    border: "#94a3b8", glow: "rgba(148,163,184,0.6)",
    accent: "#f1f5f9", shine: "rgba(241,245,249,0.5)",
  },
  gold: {
    label: "Gold", emoji: "🥇", tagline: "Premium Member",
    gradient: "linear-gradient(135deg, #78350f 0%, #b45309 25%, #fbbf24 50%, #d97706 75%, #78350f 100%)",
    border: "#fbbf24", glow: "rgba(251,191,36,0.7)",
    accent: "#fffbeb", shine: "rgba(254,243,199,0.6)",
  },
  platinum: {
    label: "Platinum", emoji: "💎", tagline: "Elite Member",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 30%, #7c3aed 50%, #4c1d95 70%, #1e1b4b 100%)",
    border: "#a78bfa", glow: "rgba(167,139,250,0.7)",
    accent: "#f3e8ff", shine: "rgba(233,213,255,0.6)",
  },
  diamond: {
    label: "Diamond", emoji: "⚫", tagline: "Executive Member",
    gradient: "linear-gradient(135deg, #000000 0%, #0f172a 30%, #1e293b 50%, #0f172a 70%, #000000 100%)",
    border: "#22d3ee", glow: "rgba(34,211,238,0.8)",
    accent: "#cffafe", shine: "rgba(165,243,252,0.5)",
  },
  cosmic: {
    label: "Cosmic", emoji: "🌌", tagline: "Platform Founder",
    gradient: "linear-gradient(135deg, #581c87 0%, #7e22ce 20%, #d946ef 40%, #8b5cf6 60%, #6366f1 80%, #1e1b4b 100%)",
    border: "#e879f9", glow: "rgba(217,70,239,0.9)",
    accent: "#fae8ff", shine: "rgba(232,121,249,0.7)",
  },
};

export interface IdCardProps {
  tier?: string;
  institution: { name: string; logo_url?: string; emoji?: string; motto?: string; city?: string; division?: string };
  student: { full_name: string; student_id?: string; roll_number?: string; class_name?: string; section?: string; guardian_phone?: string; blood_group?: string; class_role?: string; valid_until?: string; photo_url?: string };
  issueDate?: string;
  forPrint?: boolean;
}

export default function PremiumIdCard({ tier = "bronze", institution, student, issueDate, forPrint }: IdCardProps) {
  const t = TIERS[tier] || TIERS.bronze;
  const verifyUrl = `https://skbsakib500.github.io/skb-education-ecosystem/verify/?id=${student.student_id || "unknown"}`;
  const initials = student.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const issuedOn = issueDate || new Date().toISOString().slice(0, 10);
  const validUntil = student.valid_until || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return (
    <div className="id-card-wrapper" style={{
      width: "340px", height: "214px", borderRadius: "16px",
      padding: "1.5px",
      background: t.gradient,
      boxShadow: `0 20px 60px ${t.glow}, 0 0 40px ${t.glow}, inset 0 0 20px rgba(255,255,255,0.15)`,
      position: "relative",
      overflow: "hidden",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Shine overlay */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "16px",
        background: `linear-gradient(115deg, transparent 30%, ${t.shine} 50%, transparent 70%)`,
        animation: "shine 4s ease-in-out infinite",
        zIndex: 10, pointerEvents: "none",
      }} />

      {/* Card inner */}
      <div style={{
        width: "100%", height: "100%", borderRadius: "15px",
        background: t.gradient,
        position: "relative", overflow: "hidden",
        color: "white",
      }}>
        {/* Holographic circles */}
        <div style={{
          position: "absolute", top: "-40%", right: "-20%",
          width: "200px", height: "200px", borderRadius: "50%",
          background: `radial-gradient(circle, ${t.accent}22 0%, transparent 70%)`,
        }} />
        <div style={{
          position: "absolute", bottom: "-30%", left: "-10%",
          width: "150px", height: "150px", borderRadius: "50%",
          background: `radial-gradient(circle, ${t.shine} 0%, transparent 70%)`,
        }} />

        {/* Grid pattern */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.15,
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "12px 12px",
        }} />

        {/* Header */}
        <div style={{
          padding: "12px 14px 8px",
          borderBottom: `1px solid ${t.border}55`,
          display: "flex", alignItems: "center", gap: "10px",
          position: "relative", zIndex: 2,
        }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", fontWeight: "bold",
            border: `1px solid rgba(255,255,255,0.2)`,
            overflow: "hidden",
          }}>
            {institution.logo_url ? (
              <img src={institution.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (institution.emoji || "🏫")}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: "10.5px", fontWeight: "700", letterSpacing: "0.02em",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}>{institution.name}</div>
            <div style={{
              fontSize: "8px", opacity: 0.85,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{institution.city || institution.division}</div>
          </div>
          {/* Tier badge */}
          <div style={{
            background: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(8px)",
            padding: "3px 8px", borderRadius: "999px",
            fontSize: "8px", fontWeight: "700", letterSpacing: "0.08em",
            textTransform: "uppercase",
            border: `1px solid rgba(255,255,255,0.3)`,
            display: "flex", alignItems: "center", gap: "4px",
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}>
            <span style={{ fontSize: "10px" }}>{t.emoji}</span>
            {t.label}
          </div>
        </div>

        {/* Body */}
        <div style={{
          padding: "10px 14px",
          display: "flex", gap: "12px",
          position: "relative", zIndex: 2,
        }}>
          {/* Photo */}
          <div style={{
            width: "72px", height: "88px", borderRadius: "8px",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            border: `1.5px solid rgba(255,255,255,0.3)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px", fontWeight: "bold",
            color: "rgba(255,255,255,0.9)",
            overflow: "hidden", flexShrink: 0,
            boxShadow: "inset 0 0 20px rgba(0,0,0,0.2)",
          }}>
            {student.photo_url ? (
              <img src={student.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : initials}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: "14px", fontWeight: "700", lineHeight: 1.15,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              textShadow: "0 1px 3px rgba(0,0,0,0.4)",
            }}>{student.full_name}</div>

            {student.student_id && (
              <div style={{
                fontSize: "9px", fontFamily: "monospace",
                opacity: 0.85, marginTop: "2px",
                letterSpacing: "0.05em",
              }}>ID: {student.student_id}</div>
            )}

            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: "4px 8px", marginTop: "6px",
              fontSize: "8.5px",
            }}>
              {student.class_name && (
                <div>
                  <div style={{ opacity: 0.7, fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Class</div>
                  <div style={{ fontWeight: "600", marginTop: "1px" }}>
                    {student.class_name}{student.section ? " · " + student.section : ""}
                  </div>
                </div>
              )}
              {student.roll_number && (
                <div>
                  <div style={{ opacity: 0.7, fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Roll</div>
                  <div style={{ fontWeight: "600", marginTop: "1px" }}>{student.roll_number}</div>
                </div>
              )}
              {student.blood_group && (
                <div>
                  <div style={{ opacity: 0.7, fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Blood</div>
                  <div style={{ fontWeight: "600", marginTop: "1px" }}>{student.blood_group}</div>
                </div>
              )}
              {student.class_role && student.class_role !== "student" && (
                <div>
                  <div style={{ opacity: 0.7, fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</div>
                  <div style={{ fontWeight: "600", marginTop: "1px", textTransform: "capitalize" }}>
                    {student.class_role.replace("_", " ")}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* QR */}
          <div style={{
            width: "56px", height: "56px",
            background: "white", borderRadius: "6px",
            padding: "3px", flexShrink: 0,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}>
            <QRCodeSVG value={verifyUrl} size={50} level="M" bgColor="#ffffff" fgColor="#000000" />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "6px 14px",
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(8px)",
          borderTop: `1px solid ${t.border}55`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: "7.5px", zIndex: 2,
        }}>
          <div style={{ display: "flex", gap: "8px", opacity: 0.9 }}>
            <span>Issued: {issuedOn}</span>
            <span>•</span>
            <span>Valid: {validUntil}</span>
          </div>
          <div style={{
            fontSize: "7px", fontWeight: "700",
            letterSpacing: "0.08em", opacity: 0.85,
            display: "flex", alignItems: "center", gap: "3px",
          }}>
            <span style={{ fontSize: "8px" }}>{t.emoji}</span>
            {t.tagline.toUpperCase()}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shine {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        @media print {
          .id-card-wrapper { box-shadow: none !important; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
