import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

export const metadata = {
  title: "Privacy Policy — SKB Education Ecosystem",
  description:
    "How SKB Education Ecosystem collects, uses, and protects your personal data.",
};

const LAST_UPDATED = "October 17, 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <LandingNav />

      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-[30px] md:text-[40px] font-semibold tracking-tight">
            Privacy Policy
          </h1>
          <p
            className="mt-2 text-[12px]"
            style={{ color: "var(--text-muted)" }}
          >
            Last updated: {LAST_UPDATED}
          </p>

          <div
            className="mt-6 rounded-xl border-l-4 border-amber-500 p-4 text-[12px] leading-relaxed"
            style={{ background: "var(--surface-3)" }}
          >
            <span className="font-semibold">⚠️ Draft Notice:</span> This
            document is a template and must be reviewed by qualified legal
            counsel before production launch. It is not legal advice.
          </div>

          <div
            className="mt-8 space-y-6 text-[13px] leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                1. Introduction
              </h2>
              <p>
                SKB Education Ecosystem (&ldquo;we&rdquo;, &ldquo;us&rdquo;)
                respects your privacy. This policy explains what personal data
                we collect, how we use it, and your rights as a user.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                2. Data We Collect
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <span className="font-semibold text-[color:var(--text)]">
                    Account data:
                  </span>{" "}
                  name, email, password hash, role (student/teacher/parent/etc.)
                </li>
                <li>
                  <span className="font-semibold text-[color:var(--text)]">
                    Profile data:
                  </span>{" "}
                  bio, avatar, institution affiliation, social links
                </li>
                <li>
                  <span className="font-semibold text-[color:var(--text)]">
                    Content:
                  </span>{" "}
                  posts, discussions, study materials you create
                </li>
                <li>
                  <span className="font-semibold text-[color:var(--text)]">
                    Usage data:
                  </span>{" "}
                  IP address, device type, pages visited, timestamps
                </li>
                <li>
                  <span className="font-semibold text-[color:var(--text)]">
                    Verification data:
                  </span>{" "}
                  (for verified teachers/staff) identity documents, only when
                  voluntarily provided
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                3. How We Use Data
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide and improve the Platform</li>
                <li>Authenticate users and secure accounts</li>
                <li>Moderate content and enforce community standards</li>
                <li>Send transactional emails (password reset, verification)</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                4. Privacy Controls
              </h2>
              <p>
                We offer granular privacy controls. You can choose which
                profile fields are public, restricted, or hidden from your{" "}
                <span className="font-semibold text-[color:var(--text)]">
                  Privacy Settings
                </span>{" "}
                page. Some fields are never public by default.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                5. Data Sharing
              </h2>
              <p>
                We do NOT sell your personal data. We share data only with:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Service providers (Supabase for storage/database)</li>
                <li>Legal authorities, when required by law</li>
                <li>Other users, only as you explicitly choose via privacy settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                6. Children&apos;s Privacy
              </h2>
              <p>
                For users under 13, verifiable parental/guardian consent is
                required before account creation, in accordance with
                Bangladesh&apos;s Children Act 2013 and applicable
                international standards. Parents may request deletion of their
                child&apos;s data at any time.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                7. Data Retention
              </h2>
              <p>
                We retain account data while your account is active. After
                deletion, we may retain limited data (e.g., for legal
                compliance, fraud prevention) for up to 90 days.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                8. Your Rights
              </h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and associated data</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                9. Security
              </h2>
              <p>
                We use industry-standard measures: encrypted connections
                (HTTPS), hashed passwords, row-level security on our database,
                and access controls. No system is 100% secure, but we are
                committed to protecting your data.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                10. Cookies
              </h2>
              <p>
                We use essential cookies for authentication. We do not use
                third-party tracking cookies without consent.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                11. Governing Framework
              </h2>
              <p>
                This policy is designed to comply with the laws of Bangladesh
                and to align with international best practices (including GDPR
                principles where applicable).
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                12. Contact
              </h2>
              <p>
                For privacy-related inquiries or data requests, email{" "}
                <a
                  href="mailto:legal@skbeducation.com"
                  className="text-emerald-600 hover:underline font-semibold"
                >
                  legal@skbeducation.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
