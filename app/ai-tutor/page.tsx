"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const STARTER_PROMPTS = [
  { e: "📐", t: "Explain Pythagoras theorem with example", s: "Math" },
  { e: "⚛️", t: "What is Newton's 2nd law of motion?", s: "Physics" },
  { e: "🧪", t: "Difference between acid and base", s: "Chemistry" },
  { e: "📖", t: "How to write a good essay?", s: "English" },
  { e: "🧠", t: "Study plan for HSC Physics in 30 days", s: "Study" },
  { e: "🎯", t: "Tips to score A+ in Math exam", s: "Exam" },
];

export default function AITutorPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [convs, setConvs] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState<any>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConvs = async () => {
    if (!user) return;
    const { data } = await supabase.from("ai_conversations")
      .select("*").eq("user_id", user.id).eq("is_archived", false)
      .order("updated_at", { ascending: false }).limit(50);
    setConvs(data ?? []);
  };

  const loadQuota = async () => {
    const { data } = await supabase.rpc("check_ai_quota");
    setQuota(data);
  };

  const loadMessages = async (convId: string) => {
    const { data } = await supabase.from("ai_messages")
      .select("*").eq("conversation_id", convId).order("created_at").limit(200);
    setMessages(data ?? []);
  };

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login/"); return; }
    if (user) {
      loadConvs();
      loadQuota();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (activeConv) loadMessages(activeConv.id);
  }, [activeConv]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const createNewConv = async () => {
    const { data } = await supabase.rpc("create_ai_chat", { p_title: "New Chat", p_subject: null });
    if (data) {
      const { data: fresh } = await supabase.from("ai_conversations").select("*").eq("id", data).single();
      setActiveConv(fresh);
      setMessages([]);
      await loadConvs();
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || !user) return;

    const q = await supabase.rpc("check_ai_quota");
    const qData: any = q.data;
    if (!qData?.allowed) {
      alert("⏳ Daily AI limit reached. Come back tomorrow!");
      return;
    }

    let convId = activeConv?.id;
    if (!convId) {
      const { data } = await supabase.rpc("create_ai_chat", { p_title: text.slice(0, 40), p_subject: null });
      convId = data;
      const { data: fresh } = await supabase.from("ai_conversations").select("*").eq("id", convId).single();
      setActiveConv(fresh);
    }

    setSending(true);
    const userMsg = { role: "user", content: text.trim(), created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    await supabase.from("ai_messages").insert({
      conversation_id: convId, role: "user", content: text.trim(),
    });

    // Call AI response — currently template-based. Real integration: OpenAI/Anthropic API
    const aiResponse = await generateAIResponse(text.trim());

    await supabase.from("ai_messages").insert({
      conversation_id: convId, role: "assistant", content: aiResponse,
      model: "skb-tutor-v1", metadata: { source: "template" },
    });

    await supabase.rpc("increment_ai_usage");
    await loadMessages(convId);
    await loadQuota();
    await loadConvs();
    setSending(false);
  };

  const generateAIResponse = async (question: string): Promise<string> => {
    const q = question.toLowerCase();

    if (q.includes("pythagoras") || q.includes("theorem")) {
      return `**Pythagoras Theorem** 📐

সূত্র: **a² + b² = c²**

যেখানে:
- a, b = সমকোণী ত্রিভুজের দুটি বাহু (perpendicular sides)
- c = অতিভুজ (hypotenuse — সবচেয়ে বড় বাহু)

**Example:**
যদি a = 3, b = 4 হয়, তবে c = ?
- c² = 3² + 4² = 9 + 16 = 25
- c = √25 = **5**

**মনে রাখার টিপ:** 3-4-5, 5-12-13, 8-15-17 — এগুলো Pythagorean triples।

আরো example বা practice problem চাইলে বলুন! 📚`;
    }

    if (q.includes("newton") || q.includes("motion")) {
      return `**Newton's Laws of Motion** ⚛️

**১ম সূত্র (Inertia):**
একটি বস্তু স্থির থাকলে স্থির থাকবে, গতিশীল থাকলে সমান বেগে সরলরেখায় চলতে থাকবে — যতক্ষণ না বাহ্যিক বল প্রয়োগ করা হয়।

**২য় সূত্র (F = ma):**
বস্তুর উপর প্রযুক্ত বল = ভর × ত্বরণ
- **F = m × a**
- বল দ্বিগুণ করলে ত্বরণ দ্বিগুণ হয়
- ভর দ্বিগুণ করলে ত্বরণ অর্ধেক হয়

**৩য় সূত্র (Action-Reaction):**
প্রতিটি ক্রিয়ার সমান ও বিপরীত প্রতিক্রিয়া আছে।
- উদাহরণ: আপনি মেঝেতে বল প্রয়োগ করলে, মেঝে সমান ও বিপরীত বল দেয়

**Real-life example:**
গাড়ি ব্রেক করলে যাত্রী সামনে ঝুঁকে পড়ে — এটি ১ম সূত্রের উদাহরণ।

কোন specific প্রশ্ন আছে? 🎯`;
    }

    if (q.includes("acid") || q.includes("base")) {
      return `**Acid vs Base** 🧪

| বৈশিষ্ট্য | Acid (অম্ল) | Base (ক্ষারক) |
|---|---|---|
| **Taste** | টক (sour) | তিতা (bitter) |
| **pH** | 0-7 | 7-14 |
| **Litmus** | লাল হয় | নীল হয় |
| **Example** | লেবুর রস, ভিনেগার | সাবান, বেকিং সোডা |
| **H+ ion** | দেয় | নেয় |

**pH Scale:**
- 0-3: Strong acid (HCl, H₂SO₄)
- 4-6: Weak acid (ভিনেগার, লেবু)
- 7: Neutral (পানি)
- 8-10: Weak base (বেকিং সোডা)
- 11-14: Strong base (NaOH)

**Neutralization:** Acid + Base → Salt + Water
- HCl + NaOH → NaCl + H₂O

আরো example চান? 📚`;
    }

    if (q.includes("study plan") || q.includes("routine")) {
      return `**Study Plan Template** 📅

**সকাল (6-9 AM):** Hard subjects — Math, Physics
- মাথা সবচেয়ে তাজা থাকে

**দুপুর (11-1 PM):** Medium subjects — Chemistry, Biology
- ছোট break নিয়ে পড়ুন

**বিকাল (3-5 PM):** Revision of morning topics
- পুরনো topic ঘুরে দেখুন

**সন্ধ্যা (7-9 PM):** English, Bangla, lighter subjects
- Dim light-এ পড়া যাবে

**রাত (9-10 PM):** Practice problems
- যা শিখেছেন সেটা apply করুন

**Golden Rules:**
1. 📵 Phone দূরে রাখুন
2. ⏰ 50 min study + 10 min break (Pomodoro)
3. 💧 পানি খান, হালকা walk
4. 😴 7-8 ঘণ্টা ঘুম
5. 🍎 Healthy snacks

আপনি কি HSC / SSC / Admission prep? নির্দিষ্ট plan দিতে পারি। 🎯`;
    }

    if (q.includes("a+") || q.includes("score") || q.includes("exam tip")) {
      return `**A+ Score করার Tips** 🎯

**১. Syllabus সম্পূর্ণ করুন:**
- NCTB বই first, guide later
- প্রতিটি chapter-এ practice

**২. Previous Year Questions:**
- শেষ ৫ বছরের প্রশ্ন solve করুন
- Pattern চিনে ফেলবেন

**৩. Weak Areas identify করুন:**
- Mock test দিয়ে নিজেকে যাচাই করুন
- দুর্বল topic-এ ২x সময় দিন

**৪. Practice:**
- MCQ: প্রতিদিন ৫০টা minimum
- CQ: সপ্তাহে ১০টা লিখিত

**৫. Time Management:**
- Exam-এর মতো করে practice
- ৩ ঘণ্টায় ১০০ নম্বর

**৬. Revision System:**
- Day 1: New topic
- Day 3: Quick revision
- Day 7: Full revision
- Day 30: Long-term retention

**৭. Health:**
- রাতে ৭ ঘণ্টা ঘুম
- Exam-এর আগে ভালো breakfast

কোন subject-এ help চাই? 📚`;
    }

    if (q.includes("essay") || q.includes("writing")) {
      return `**How to Write a Good Essay** ✍️

**Structure:**

**১. Introduction (10%)**
- Hook: একটা প্রশ্ন বা surprising fact দিয়ে শুরু
- Background: Topic-এর context দিন
- Thesis: আপনার main argument বলুন

**২. Body Paragraphs (80%)**
প্রতিটি paragraph-এ:
- Topic sentence (একটা main idea)
- Evidence / example
- Explanation
- Link to next paragraph

**৩. Conclusion (10%)**
- Restate thesis (ভিন্ন শব্দে)
- Summary of main points
- Broader implication

**Tips:**
1. শুরুতেই essay-টা শেষ করবেন না — draft লিখুন
2. Simple English ব্যবহার করুন
3. Active voice বেশি use করুন
4. Short sentences ভালো
5. Proofread করুন — spelling, grammar

**Word count:**
- Class 9-10: 250-300
- HSC: 400-500
- Admission: 300-350

Topic বললে sample essay লিখে দিতে পারি। 📚`;
    }

    // Fallback
    return `আপনার প্রশ্ন পেয়েছি: **"${question}"**

আমি SKB AI Tutor — একটি basic version. এখনি limited প্রশ্নে সাহায্য করতে পারি:
- 📐 **Math** (Pythagoras, algebra, geometry)
- ⚛️ **Physics** (Newton laws, motion, energy)
- 🧪 **Chemistry** (acid/base, reactions)
- 📖 **English** (essay writing, grammar)
- 📅 **Study plans** (routine, exam prep)
- 🎯 **Exam tips** (score improvement)

আপনার প্রশ্নটা আরেকটু specifically লিখুন — উদাহরণসহ। অথবা উপরের কোন topic নিয়ে জানতে চান বলুন।

**Full AI integration** (OpenAI/Claude API) — পরের version-এ আসছে! 🚀`;
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  return (
    <main className="min-h-screen flex bg-[var(--bg)]">
      {/* Sidebar */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-40 w-[280px] border-r transition-transform ${showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <Link href="/hub" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-[16px] shadow-lg">🤖</div>
              <div>
                <div className="text-[13px] font-semibold">AI Tutor</div>
                <div className="text-fluid-micro" style={{ color: "var(--text-muted)" }}>skb-tutor-v1</div>
              </div>
            </Link>
            <button onClick={() => setShowSidebar(false)} className="md:hidden text-[18px]">✕</button>
          </div>

          {quota && (
            <div className="mt-3 rounded-xl bg-[var(--bg-soft)] p-2.5">
              <div className="flex items-center justify-between text-fluid-micro">
                <span style={{ color: "var(--text-muted)" }}>Today's quota</span>
                <span className="font-semibold">{quota.used}/{quota.limit}</span>
              </div>
              <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: "var(--border)" }}>
                <div className="h-full rounded-full" style={{
                  width: Math.min(100, (quota.used / quota.limit) * 100) + "%",
                  background: quota.remaining > 5 ? "linear-gradient(90deg,#10b981,#14b8a6)" : "linear-gradient(90deg,#f59e0b,#f43f5e)",
                }} />
              </div>
            </div>
          )}

          <button onClick={createNewConv}
            className="mt-3 w-full rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 py-2 text-[13px] font-semibold text-white shadow">
            + New Chat
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
          {convs.length === 0 ? (
            <div className="p-4 text-center text-fluid-caption" style={{ color: "var(--text-muted)" }}>No conversations yet</div>
          ) : convs.map((c) => (
            <button key={c.id} onClick={() => { setActiveConv(c); setShowSidebar(false); }}
              className={"w-full text-left px-4 py-3 border-b text-fluid-caption hover:bg-[var(--bg-soft)] " + (activeConv?.id === c.id ? "bg-violet-500/10" : "")}
              style={{ borderColor: "var(--border)" }}>
              <div className="font-medium truncate">{c.title}</div>
              <div className="text-fluid-micro" style={{ color: "var(--text-muted)" }}>{c.total_messages} messages</div>
            </button>
          ))}
        </div>

        <div className="border-t p-3" style={{ borderColor: "var(--border)" }}>
          <button onClick={signOut} className="w-full rounded-full border py-2 text-fluid-caption" style={{ borderColor: "var(--border)" }}>Sign out</button>
        </div>
      </aside>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b p-3 flex items-center gap-2"
          style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
          <button onClick={() => setShowSidebar(true)} className="md:hidden text-[20px]">☰</button>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold truncate">{activeConv?.title || "AI Tutor"}</div>
            <div className="text-fluid-micro" style={{ color: "var(--text-muted)" }}>Ask anything about your studies</div>
          </div>
          {quota && (
            <div className="rounded-full bg-violet-500/15 px-3 py-1 text-fluid-micro font-semibold text-violet-700">
              {quota.remaining} left today
            </div>
          )}
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4" style={{ maxHeight: "calc(100vh - 140px)" }}>
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-[64px]">🤖</div>
                <div className="mt-3 text-[20px] font-semibold">Hi {user?.email?.split("@")[0]}!</div>
                <div className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
                  যেকোনো বিষয়ে জিজ্ঞাসা করুন — Math, Physics, Chemistry, English, Study Tips
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
                  {STARTER_PROMPTS.map((p, i) => (
                    <button key={i} onClick={() => send(p.t)}
                      className="rounded-xl border p-3 text-left hover:-translate-y-0.5 hover:shadow-md transition"
                      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                      <div className="text-[20px]">{p.e}</div>
                      <div className="text-fluid-caption font-medium mt-1">{p.t}</div>
                      <div className="text-fluid-micro mt-0.5" style={{ color: "var(--text-muted)" }}>{p.s}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div key={i} className={"flex gap-3 " + (isUser ? "justify-end" : "")}>
                  {!isUser && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-[14px] shrink-0">
                      🤖
                    </div>
                  )}
                  <div className={"max-w-[85%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed " + (isUser ? "text-white" : "")}
                    style={isUser
                      ? { background: "linear-gradient(135deg,#10b981,#14b8a6)" }
                      : { background: "var(--surface-3)", border: "1px solid var(--border)" }}>
                    <div className="whitespace-pre-wrap break-words" style={{ fontFamily: isUser ? "inherit" : "inherit" }}>
                      {m.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-[14px] shrink-0">🤖</div>
                <div className="rounded-2xl px-4 py-3" style={{ background: "var(--surface-3)", border: "1px solid var(--border)" }}>
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="sticky bottom-0 border-t p-3"
          style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
          <div className="mx-auto max-w-3xl flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 rounded-full border px-4 py-2.5 text-[14px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <button type="submit" disabled={sending || !input.trim()}
              className="rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow disabled:opacity-50">
              {sending ? "..." : "Send →"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
