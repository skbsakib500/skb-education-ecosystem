import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

export const metadata = {
  title: "Terms of Service — SKB Education Ecosystem",
  description: "Terms governing the use of the SKB Education Ecosystem platform.",
};

const LAST_UPDATED = "October 17, 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <LandingNav />

      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-[30px] md:text-[40px] font-semibold tracking-tight">
            Terms of Service
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
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using SKB Education Ecosystem (&ldquo;the
                Platform&rdquo;), you agree to be bound by these Terms of
                Service. If you do not agree, please discontinue use of the
                Platform. These terms apply to all users, including
                institution owners, teachers, students, parents, and tutors.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                2. Eligibility
              </h2>
              <p>
                You must be at least 13 years of age to create an account. If
                you are under 18, you must have verifiable parental or
                guardian consent, in accordance with Bangladesh&apos;s Children
                Act 2013 and applicable international standards. Institutions
                registering on behalf of minors are responsible for obtaining
                such consent.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                3. Account Responsibilities
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of
                your account credentials and for all activity under your
                account. Notify us immediately of any unauthorized use.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                4. Acceptable Use
              </h2>
              <p className="mb-2">You agree NOT to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Violate any applicable law of Bangladesh</li>
                <li>
                  Post content that is defamatory, obscene, harassing, or
                  harmful to minors
                </li>
                <li>
                  Upload or distribute copyrighted material (including NCTB
                  textbooks) without proper authorization
                </li>
                <li>
                  Impersonate another person or institution, or misrepresent
                  affiliations
                </li>
                <li>
                  Attempt to gain unauthorized access to other accounts or
                  data
                </li>
                <li>
                  Use automated systems to access the Platform in ways that
                  degrade service
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                5. Content Ownership
              </h2>
              <p>
                You retain ownership of content you create. By posting, you
                grant SKB Education a non-exclusive, worldwide, royalty-free
                license to host, display, and distribute your content within
                the Platform. You are solely responsible for ensuring you have
                the necessary rights to any content you upload.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                6. NCTB Disclaimer
              </h2>
              <p>
                SKB Education Ecosystem is an independent educational
                initiative. We are NOT affiliated with, endorsed by, or
                officially connected to the National Curriculum and Textbook
                Board (NCTB) of Bangladesh. Any references to NCTB syllabus or
                curriculum are for educational alignment purposes only. Users
                must not reproduce NCTB textbooks without written permission
                from the appropriate authorities.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                7. Moderation and Enforcement
              </h2>
              <p>
                We reserve the right to remove content or suspend accounts
                that violate these Terms, without prior notice where necessary
                for user safety or legal compliance.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                8. Fees and Payment
              </h2>
              <p>
                Free-tier features are provided without charge. Paid plans,
                when available, will be subject to separate billing terms
                displayed at the time of purchase.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                9. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by law, SKB Education
                Ecosystem shall not be liable for indirect, incidental, or
                consequential damages arising from use of the Platform. Our
                total liability shall not exceed amounts paid by you, if any,
                in the preceding 12 months.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                10. Termination
              </h2>
              <p>
                You may delete your account at any time. We may suspend or
                terminate accounts that violate these Terms or pose a risk to
                the platform or other users.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                11. Governing Law
              </h2>
              <p>
                These Terms are governed by the laws of the People&apos;s
                Republic of Bangladesh. Disputes shall be subject to the
                exclusive jurisdiction of the courts of Dhaka, Bangladesh.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                12. Changes to Terms
              </h2>
              <p>
                We may update these Terms from time to time. Material changes
                will be communicated via email or prominent notice on the
                Platform at least 30 days before taking effect.
              </p>
            </section>

            <section>
              <h2 className="text-[16px] font-semibold text-[color:var(--text)] mb-2">
                13. Contact
              </h2>
              <p>
                Questions about these Terms? Email{" "}
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
