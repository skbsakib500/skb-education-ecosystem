import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

export const metadata = {
  title: "Contact — SKB Education Ecosystem",
  description:
    "Get in touch with the SKB Education team. Support, partnerships, press inquiries.",
};

const CONTACTS = [
  {
    emoji: "💬",
    title: "General Support",
    desc: "প্রশ্ন, সমস্যা, বা suggestion — যেকোনো কিছু।",
    email: "support@skbeducation.com",
  },
  {
    emoji: "🤝",
    title: "Partnership",
    desc: "প্রতিষ্ঠান, NGO, বা government collaboration।",
    email: "partners@skbeducation.com",
  },
  {
    emoji: "📰",
    title: "Press & Media",
    desc: "Interview, brand assets, media inquiries।",
    email: "press@skbeducation.com",
  },
  {
    emoji: "⚖️",
    title: "Legal & Privacy",
    desc: "Data subject requests, legal notices।",
    email: "legal@skbeducation.com",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <LandingNav />

      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[12px] font-medium"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-3)",
            }}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Contact
          </div>

          <h1 className="mt-6 text-[32px] md:text-[44px] font-semibold tracking-tight">
            কথা বলি
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {" "}
              একসাথে
            </span>
          </h1>

          <p
            className="mt-5 text-[15px] leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            যেকোনো প্রশ্ন, সমস্যা বা নতুন idea — আমাদের জানান। আমরা সাধারণত
            ২৪-৪৮ ঘণ্টার মধ্যে উত্তর দিই।
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            {CONTACTS.map((c) => (
              <a
                key={c.title}
                href={`mailto:${c.email}`}
                className="group rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-3)",
                }}
              >
                <div className="text-[28px]">{c.emoji}</div>
                <div className="mt-3 text-[14px] font-semibold">
                  {c.title}
                </div>
                <p
                  className="mt-2 text-[12px] leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  {c.desc}
                </p>
                <div className="mt-3 text-[12px] font-semibold text-emerald-600 group-hover:underline">
                  {c.email} →
                </div>
              </a>
            ))}
          </div>

          <div
            className="mt-10 rounded-2xl border p-6"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-3)",
            }}
          >
            <h2 className="text-[16px] font-semibold">Head Office</h2>
            <p
              className="mt-2 text-[13px] leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              Dhaka, Bangladesh
              <br />
              (Full address available on request)
            </p>
          </div>

          <div
            className="mt-6 rounded-2xl border p-6 text-[12px] leading-relaxed"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-3)",
              color: "var(--text-muted)",
            }}
          >
            <span className="font-semibold" style={{ color: "var(--text)" }}>
              Response time:
            </span>{" "}
            সাধারণত ২৪-৪৮ ঘণ্টা (business days)। জরুরি technical issue হলে{" "}
            <a
              href="mailto:support@skbeducation.com?subject=URGENT"
              className="text-emerald-600 font-semibold hover:underline"
            >
              support@skbeducation.com
            </a>{" "}
            এ subject-এ &quot;URGENT&quot; লিখে পাঠান।
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
