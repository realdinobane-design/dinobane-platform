export default function NewsPage() {
  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      <div className="px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-black text-white" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            Intel Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Live UK political news — viral, suppressed & buried stories</p>
        </div>
        <a
          href="https://www.perplexity.ai/computer/a/dinobane-intel-T.dGgQswTBWIFEGGteWrwQ"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
          data-testid="link-open-intel"
        >
          Open full dashboard ↗
        </a>
      </div>
      <div className="flex-1 overflow-hidden">
        <iframe
          src="https://www.perplexity.ai/computer/a/dinobane-intel-T.dGgQswTBWIFEGGteWrwQ"
          title="DinoBane Intel News Dashboard"
          className="w-full h-full border-0"
          loading="lazy"
          data-testid="iframe-news"
        />
      </div>
    </div>
  );
}
