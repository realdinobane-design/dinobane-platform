import { useState, useRef } from "react";
import { Link } from "wouter";
import { Mail, Send, Loader2, CheckCircle2 } from "lucide-react";
import HCaptcha from "@hcaptcha/react-hcaptcha";

const HCAPTCHA_SITEKEY = import.meta.env.VITE_HCAPTCHA_SITEKEY || "10000000-ffff-ffff-ffff-000000000001";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const captchaRef = useRef<HCaptcha>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      setErrorMsg("Please complete the captcha.");
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, captchaToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setStatus("success");
      setName(""); setEmail(""); setSubject(""); setMessage("");
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-sm text-[#f0c800] hover:underline mb-6 inline-block">← Back to DinoBane</Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-8 bg-[#cc2a2a]" />
            <h1 className="text-3xl font-black uppercase tracking-widest text-white">Contact</h1>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Have a story tip, business enquiry, or question? Get in touch below or email directly.
          </p>
        </div>

        {/* Direct email card */}
        <a
          href="mailto:contact@realdinobane.com"
          className="flex items-center gap-4 p-4 mb-10 border border-[#cc2a2a]/30 bg-[#cc2a2a]/5 rounded hover:bg-[#cc2a2a]/10 transition-colors group"
        >
          <div className="w-10 h-10 bg-[#cc2a2a]/15 rounded flex items-center justify-center shrink-0 group-hover:bg-[#cc2a2a]/25 transition-colors">
            <Mail size={18} className="text-[#cc2a2a]" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">Email directly</p>
            <p className="text-white font-semibold text-sm">contact@realdinobane.com</p>
          </div>
        </a>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-[#1a1a1a]" />
          <span className="text-xs text-zinc-600 uppercase tracking-widest">or use the form</span>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
        </div>

        {/* Form */}
        {status === "success" ? (
          <div className="border border-green-800/40 bg-green-900/10 rounded p-8 text-center">
            <CheckCircle2 size={40} className="text-green-400 mx-auto mb-4" />
            <h2 className="text-white font-bold text-lg mb-2">Message sent</h2>
            <p className="text-zinc-400 text-sm">Thanks for getting in touch. We'll get back to you as soon as possible.</p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-6 px-6 py-2.5 bg-[#1a1a1a] hover:bg-[#222] text-white text-sm rounded transition-colors"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-1.5">Name *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="w-full bg-[#111] border border-[#222] rounded text-white text-sm px-4 py-3 focus:outline-none focus:border-[#cc2a2a]/60 placeholder-zinc-700 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-1.5">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full bg-[#111] border border-[#222] rounded text-white text-sm px-4 py-3 focus:outline-none focus:border-[#cc2a2a]/60 placeholder-zinc-700 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-1.5">Subject *</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
                placeholder="What is this about?"
                className="w-full bg-[#111] border border-[#222] rounded text-white text-sm px-4 py-3 focus:outline-none focus:border-[#cc2a2a]/60 placeholder-zinc-700 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-1.5">Message *</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                rows={6}
                placeholder="Write your message here..."
                className="w-full bg-[#111] border border-[#222] rounded text-white text-sm px-4 py-3 focus:outline-none focus:border-[#cc2a2a]/60 placeholder-zinc-700 transition-colors resize-none"
              />
            </div>

            {/* hCaptcha */}
            <div>
              <HCaptcha
                sitekey={HCAPTCHA_SITEKEY}
                theme="dark"
                onVerify={token => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
                ref={captchaRef}
              />
            </div>

            {errorMsg && (
              <p className="text-[#cc2a2a] text-sm">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="flex items-center gap-2 px-8 py-3 bg-[#cc2a2a] hover:bg-[#aa2020] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-widest rounded transition-colors"
            >
              {status === "sending" ? (
                <><Loader2 size={16} className="animate-spin" /> Sending...</>
              ) : (
                <><Send size={16} /> Send Message</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
