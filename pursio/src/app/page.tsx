import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleCheck,
  ChevronDown,
  Inbox,
  LockKeyhole,
  Pause,
  Radar,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react";

const workflow = [
  {
    icon: Radar,
    title: "Find the signal",
    description: "Pursio watches the inboxes and sources you choose, then brings relevant opportunities into one place.",
  },
  {
    icon: Target,
    title: "Understand the fit",
    description: "See a clear score, the evidence behind it, and the gaps or unknowns that matter.",
  },
  {
    icon: Workflow,
    title: "Take the next step",
    description: "Prepare tailored materials, review important decisions, and track every conversation through to an outcome.",
  },
];

const trustFeatures = [
  { icon: LockKeyhole, title: "Grounded in your facts", description: "Application material uses verified profile details, never invented credentials." },
  { icon: Pause, title: "Control stays with you", description: "Set clear action rules and pause the agent whenever you choose." },
  { icon: CircleCheck, title: "Decisions you can inspect", description: "Review match reasons, action history, and the source behind each opportunity." },
  { icon: Inbox, title: "One connected pipeline", description: "Keep opportunities, drafts, replies, and outcomes together." },
];

function ProductPreview() {
  const opportunities = [
    { title: "Senior Frontend Engineer", company: "Northstar Labs", score: "92" },
    { title: "Website rebuild proposal", company: "Monarch Studio", score: "86" },
  ];
  const events = ["Found 4 new opportunities", "Scored Northstar Labs", "Gmail sync complete"];

  return (
    <div className="relative mx-auto mt-16 max-w-[1080px] rounded-[18px] border border-[#D9D9E3] bg-white p-2 shadow-[0_30px_80px_rgba(24,24,27,0.14)] sm:mt-20">
      <div className="overflow-hidden rounded-[12px] border border-[#E4E4E7] bg-[#F8F9FB]">
        <div className="flex h-11 items-center justify-between border-b border-[#E4E4E7] bg-white px-4 sm:px-5">
          <div className="flex items-center gap-2 text-[12px] font-[600]">
            <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-[#4F46E5] text-white"><Sparkles className="h-3 w-3" /></span>
            Pursio <span className="hidden text-[#A1A1AA] sm:inline">/ Overview</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#71717A]">
            <span className="hidden items-center gap-1.5 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" /> Agent running</span>
            <span className="h-6 w-6 rounded-full bg-[#E0E7FF] text-center font-[600] leading-6 text-[#4338CA]">O</span>
          </div>
        </div>
        <div className="grid min-h-[360px] grid-cols-1 lg:grid-cols-[1fr_280px]">
          <div className="p-5 sm:p-7">
            <div className="flex items-end justify-between">
              <div><p className="text-[11px] font-[600] uppercase tracking-[0.12em] text-[#4F46E5]">Your daily brief</p><h2 className="mt-1 text-[22px] font-[600] tracking-[-0.03em]">Your opportunity cockpit</h2></div>
              <span className="hidden rounded-[7px] border border-[#E4E4E7] bg-white px-2.5 py-1.5 text-[11px] font-[600] text-[#52525B] sm:block">Last sync 2m ago</span>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
              {[["18", "Found"], ["7", "High matches"], ["3", "Need you"]].map(([value, label]) => <div key={label} className="rounded-[9px] border border-[#E4E4E7] bg-white p-3"><p className="text-[20px] font-[600]">{value}</p><p className="mt-0.5 text-[10px] text-[#71717A] sm:text-[11px]">{label}</p></div>)}
            </div>
            <div className="mt-5 rounded-[10px] border border-[#E4E4E7] bg-white">
              <div className="flex items-center justify-between border-b border-[#F3F4F6] px-4 py-3"><p className="text-[12px] font-[600]">Needs your attention</p><span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-[600] text-[#4F46E5]">3 items</span></div>
              {opportunities.map((item) => <div key={item.title} className="flex items-center gap-3 border-b border-[#F3F4F6] px-4 py-3 last:border-0"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-[#EEF2FF] text-[#4F46E5]"><Target className="h-3.5 w-3.5" /></div><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-[600]">{item.title}</p><p className="text-[10px] text-[#71717A]">{item.company}</p></div><span className="text-[11px] font-[600] text-[#15803D]">{item.score}%</span><ArrowUpRight className="h-3 w-3 text-[#A1A1AA]" /></div>)}
            </div>
          </div>
          <aside className="hidden border-l border-[#E4E4E7] bg-white p-5 lg:block">
            <div className="flex items-center justify-between"><p className="text-[12px] font-[600]">Agent activity</p><span className="text-[10px] text-[#71717A]">Recent</span></div>
            <div className="mt-5 space-y-5">{events.map((event, index) => <div key={event} className="flex gap-2.5"><span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#EEF2FF] text-[#4F46E5]"><CircleCheck className="h-3 w-3" /></span><div><p className="text-[11px] font-[500]">{event}</p><p className="mt-0.5 text-[10px] text-[#A1A1AA]">{["2m", "8m", "12m"][index]} ago</p></div></div>)}</div>
            <div className="mt-10 rounded-[9px] border border-[#D1FAE5] bg-[#F0FDF4] p-3"><div className="flex items-center gap-2 text-[11px] font-[600] text-[#15803D]"><span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" /> Rules active</div><p className="mt-1 text-[10px] leading-[15px] text-[#52705B]">Actions follow the limits you set.</p></div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#FCFCFD] text-[#18181B]">
      <nav className="relative z-10 mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-[15px] font-[700] tracking-[-0.03em]"><span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#4F46E5] text-white shadow-[0_5px_16px_rgba(79,70,229,0.25)]"><Sparkles className="h-4 w-4" /></span>Pursio</Link>
        <div className="hidden items-center gap-7 text-[13px] font-[500] text-[#71717A] md:flex"><a href="#product" className="hover:text-[#18181B]">Product <ChevronDown className="ml-1 inline h-3 w-3" /></a><a href="#how-it-works" className="hover:text-[#18181B]">How it works</a><a href="#trust" className="hover:text-[#18181B]">Trust</a></div>
        <div className="flex items-center gap-2.5 text-[13px] font-[600]"><Link href="/dashboard" className="hidden px-3 py-2 text-[#52525B] hover:text-[#18181B] sm:block">Sign in</Link><Link href="/dashboard" className="rounded-[8px] bg-[#18181B] px-3.5 py-2.5 text-white hover:bg-[#3F3F46]">Get started <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link></div>
      </nav>

      <section id="product" className="relative px-5 pb-20 pt-20 sm:px-8 sm:pt-28 lg:pb-28">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,#EEF2FF_0%,rgba(238,242,255,0)_68%)]" />
        <div className="relative mx-auto max-w-[920px] text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#C7D2FE] bg-[#EEF2FF] px-3 py-1.5 text-[11px] font-[600] text-[#4338CA]"><span className="h-1.5 w-1.5 rounded-full bg-[#4F46E5]" /> PERSONAL OPPORTUNITY INTELLIGENCE</div>
          <h1 className="text-[clamp(44px,7.4vw,86px)] font-[600] leading-[0.94] tracking-[-0.075em]">Your next move<br /><span className="text-[#4F46E5]">starts with a signal.</span></h1>
          <p className="mx-auto mt-7 max-w-[620px] text-[16px] leading-[27px] text-[#52525B] sm:text-[18px]">The right role. The right client. The right moment. Pursio finds opportunities across your inbox, explains why they fit, and helps you move forward with confidence.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/dashboard" className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#4F46E5] px-5 text-[14px] font-[600] text-white shadow-[0_9px_22px_rgba(79,70,229,0.25)] hover:bg-[#4338CA]">Explore your workspace <ArrowRight className="h-4 w-4" /></Link><a href="#how-it-works" className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-[#E4E4E7] bg-white px-5 text-[14px] font-[600] hover:border-[#C7D2FE]">See how Pursio works <ArrowUpRight className="h-4 w-4 text-[#71717A]" /></a></div>
        </div>
        <ProductPreview />
      </section>

      <section id="how-it-works" className="border-y border-[#E4E4E7] bg-white"><div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 lg:py-28"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div className="max-w-[550px]"><p className="text-[11px] font-[600] uppercase tracking-[0.14em] text-[#4F46E5]">A clearer way forward</p><h2 className="mt-3 text-[32px] font-[600] leading-[39px] tracking-[-0.045em] sm:text-[42px] sm:leading-[48px]">From scattered signals<br />to deliberate action.</h2></div><p className="max-w-[390px] text-[14px] leading-[23px] text-[#71717A]">Pursio handles the repetitive search and sorting, so your attention goes where judgment matters.</p></div><div className="mt-14 grid gap-px overflow-hidden rounded-[14px] border border-[#E4E4E7] bg-[#E4E4E7] md:grid-cols-3">{workflow.map(({ icon: Icon, title, description }, index) => <article key={title} className="bg-[#FCFCFD] p-6 sm:p-8"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-[#EEF2FF] text-[#4F46E5]"><Icon className="h-5 w-5" /></span><span className="font-mono text-[11px] text-[#A1A1AA]">0{index + 1} / 03</span></div><h3 className="mt-12 text-[17px] font-[600]">{title}</h3><p className="mt-2 text-[14px] leading-[22px] text-[#71717A]">{description}</p></article>)}</div></div></section>

      <section id="trust" className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 lg:py-28"><div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><p className="text-[11px] font-[600] uppercase tracking-[0.14em] text-[#4F46E5]">Designed for trust</p><h2 className="mt-3 text-[32px] font-[600] leading-[39px] tracking-[-0.045em] sm:text-[42px] sm:leading-[48px]">Stay in the loop.<br />Stay in control.</h2><p className="mt-5 max-w-[430px] text-[15px] leading-[25px] text-[#71717A]">Automation should earn your trust through clear rules, visible reasoning, and a complete record of what happened.</p><Link href="/dashboard/agent-rules" className="mt-7 inline-flex items-center gap-2 text-[14px] font-[600] text-[#4F46E5] hover:underline">Explore agent rules <ArrowRight className="h-4 w-4" /></Link></div><div className="grid gap-3 sm:grid-cols-2">{trustFeatures.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-[12px] border border-[#E4E4E7] bg-white p-5 shadow-[0_6px_22px_rgba(24,24,27,0.035)]"><Icon className="h-5 w-5 text-[#4F46E5]" /><h3 className="mt-6 text-[14px] font-[600]">{title}</h3><p className="mt-1.5 text-[13px] leading-[20px] text-[#71717A]">{description}</p></article>)}</div></div></section>

      <section className="mx-5 mb-10 overflow-hidden rounded-[16px] bg-[#18181B] px-6 py-14 text-white sm:mx-8 sm:px-12 lg:mx-auto lg:max-w-[1240px] lg:py-20"><div className="max-w-[650px]"><p className="text-[11px] font-[600] uppercase tracking-[0.14em] text-[#A5B4FC]">Make the next move count</p><h2 className="mt-3 text-[34px] font-[600] leading-[39px] tracking-[-0.045em] sm:text-[48px] sm:leading-[53px]">More signal. Less searching.</h2><p className="mt-4 max-w-[500px] text-[15px] leading-[24px] text-[#A1A1AA]">Put your opportunity pipeline in motion, with the context and control to make every action yours.</p><Link href="/dashboard" className="mt-8 inline-flex h-11 items-center gap-2 rounded-[8px] bg-white px-5 text-[14px] font-[600] text-[#18181B] hover:bg-[#EEF2FF]">Open Pursio <ArrowRight className="h-4 w-4" /></Link></div></section>

      <footer className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 pb-10 text-[12px] text-[#A1A1AA] sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>© 2026 Pursio · Personal opportunity intelligence</span><span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#15803D]" /> Built for deliberate action</span></footer>
    </main>
  );
}
