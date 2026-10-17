import Link from "next/link";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

export const metadata = {
  title: "About — SKB Education Ecosystem",
  description:
    "Bangladesh's first multi-tenant EdTech platform. Built for schools, colleges, coaching centers, tutors, students and parents.",
};

export default function AboutPage() {
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
            About Us
          </div>

          <h1 className="mt-6 text-[32px] md:text-[44px] font-semibold tracking-tight">
            শিক্ষার জন্য এক
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {" "}
              আধুনিক زیرstructure
            </span>
          </h1>

          <p
            className="mt-5 text-[15px] leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            SKB Education Ecosystem হলো বাংলাদেশের প্রথম multi-tenant EdTech
            প্ল্যাটফর্ম — যেখানে হাজারো প্রতিষ্ঠান একই সফটওয়্যারে নিজেদের
            আলাদা instance পরিচালনা করতে পারে। প্রতিটি স্কুল, কলেজ, কোচিং,
            মাদ্রাসা — নিজের admin, নিজের rules, নিজের data।
          </p>

          <div
            className="mt-10 rounded-2xl border p-6"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-3)",
            }}
          >
            <h2 className="text-[18px] font-semibold">Our Mission</h2>
            <p
              className="mt-3 text-[13px] leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              বাংলাদেশের প্রতিটি প্রতিষ্ঠানকে — গ্রামের ছোট মাদ্রাসা থেকে
              শহরের বড় কলেজ পর্যন্ত — একই মানের digital infrastructure
              দেওয়া। শিক্ষক যেন শিক্ষাদানে মন দিতে পারেন, admin যেন paper-এর
              বদলে মানুষকে manage করেন, আর শিক্ষার্থী যেন যেকোনো জায়গা থেকে
              যেকোনো সময় শিখতে পারে।
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                emoji: "🔐",
                title: "Privacy First",
                desc: "প্রতি ব্যবহারকারীর data সম্পূর্ণ তার নিজের নিয়ন্ত্রণে।",
              },
              {
                emoji: "🛡️",
                title: "Safe Community",
                desc: "Moderation system দিয়ে নিরাপদ শিক্ষামূলক পরিবেশ।",
              },
              {
                emoji: "🇧🇩",
                title: "Made for BD",
                desc: "বাংলাদেশের শিক্ষা ব্যবস্থা, ভাষা এবং সংস্কৃতির জন্য।",
              },
            ].map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border p-5"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-3)",
                }}
              >
                <div className="text-[24px]">{v.emoji}</div>
                <div className="mt-2 text-[13px] font-semibold">
                  {v.title}
                </div>
                <p
                  className="mt-2 text-[12px] leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  {v.desc}
                </p>
              </div>
            ))}
          </div>

          <div
            className="mt-10 rounded-2xl border p-6"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-3)",
            }}
          >
            <h2 className="text-[18px] font-semibold">Founder&apos;s Note</h2>
            <p
              className="mt-3 text-[13px] leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              &ldquo;শিক্ষা বাংলাদেশের সবচেয়ে বড় সম্পদ। কিন্তু আমাদের
              প্রতিষ্ঠানগুলো এখনো কাগজ-কলম আর Excel-এ আটকে আছে। SKB Education
              Ecosystem সেই ফাঁক পূরণ করতে চায় — একটা প্ল্যাটফর্ম, যেখানে
              প্রযুক্তি শিক্ষার সহায়ক, বাধা নয়।&rdquo;
            </p>
            <div className="mt-4 text-[12px] font-semibold">
              — SKB Sakib, Founder
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/get-started/"
              className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-3 text-[13px] font-semibold text-white shadow-lg"
            >
              Get Started →
            </Link>
            <Link
              href="/contact/"
              className="rounded-full border px-6 py-3 text-[13px] font-medium"
              style={{ borderColor: "var(--border)" }}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
