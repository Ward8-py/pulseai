import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
// Replace these with your actual free API keys:
// NewsAPI:  https://newsapi.org/register  (free tier: 100 req/day)
// Groq:     https://console.groq.com      (free tier: generous)
const CONFIG = {
  NEWS_API_KEY: import.meta.env.VITE_NEWS_API_KEY || "",
  GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY || "",
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500&family=Lora:ital,wght@0,400;1,400&display=swap');

:root {
  --bg:        #07080a;
  --surface:   #0d0f13;
  --card:      #111318;
  --border:    #1c2030;
  --border2:   #252a3a;
  --gold:      #c9a84c;
  --gold-dim:  #7a6020;
  --gold-glow: rgba(201,168,76,0.12);
  --gold-glow2:rgba(201,168,76,0.06);
  --green:     #3ddc84;
  --red:       #ff5f57;
  --blue:      #4f9eff;
  --text:      #e8eaf0;
  --muted:     #6b7280;
  --dimmed:    #374151;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  font-family: 'Lora', Georgia, serif;
  color: var(--text);
  overflow-x: hidden;
}

@keyframes fadeUp {
  from { opacity:0; transform:translateY(16px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes fadeIn {
  from { opacity:0; } to { opacity:1; }
}
@keyframes ticker {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes pulse {
  0%,100% { opacity:1; } 50% { opacity:0.3; }
}
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
@keyframes slideIn {
  from { opacity:0; transform:translateX(-10px); }
  to   { opacity:1; transform:translateX(0); }
}

/* ── Ticker Bar ── */
.ticker-wrap {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  overflow: hidden;
  height: 34px;
  display: flex;
  align-items: center;
}
.ticker-label {
  flex-shrink: 0;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  color: var(--gold);
  letter-spacing: 2px;
  padding: 0 16px;
  border-right: 1px solid var(--border2);
  height: 100%;
  display: flex;
  align-items: center;
  background: var(--surface);
  z-index: 2;
}
.ticker-track {
  display: flex;
  white-space: nowrap;
  animation: ticker 38s linear infinite;
  gap: 0;
}
.ticker-item {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: var(--muted);
  padding: 0 28px;
  border-right: 1px solid var(--border);
  height: 34px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.ticker-item span { color: var(--text); }
.ticker-item .up   { color: var(--green); }
.ticker-item .down { color: var(--red); }

/* ── Header ── */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 32px;
  border-bottom: 1px solid var(--border);
  background: rgba(7,8,10,0.95);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 100;
  animation: fadeIn 0.4s ease both;
}
.brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.brand-name {
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.5px;
}
.brand-name em {
  color: var(--gold);
  font-style: normal;
}
.brand-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  letter-spacing: 2.5px;
  color: var(--gold-dim);
  text-transform: uppercase;
  margin-top: 2px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}
.live-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  color: var(--green);
  letter-spacing: 1.5px;
}
.live-dot {
  width: 6px; height: 6px;
  background: var(--green);
  border-radius: 50%;
  animation: pulse 1.5s ease infinite;
}
.time-display {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  color: var(--muted);
}

/* ── Layout ── */
html, body, #root {
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}
.layout {
  display: grid;
  grid-template-columns: 220px 1fr 300px;
  flex: 1;
  min-height: 0; /* critical — prevents flex children from overflowing */
  overflow: hidden;
}

/* ── Sidebar ── */
.sidebar {
  border-right: 1px solid var(--border);
  padding: 24px 0;
  background: var(--surface);
  overflow-y: auto;
  height: 100%;
}
.sidebar-section {
  margin-bottom: 32px;
}
.sidebar-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  letter-spacing: 3px;
  color: var(--dimmed);
  text-transform: uppercase;
  padding: 0 20px;
  margin-bottom: 10px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.15s;
  border-left: 2px solid transparent;
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 0.3px;
}
.nav-item:hover {
  color: var(--text);
  background: var(--gold-glow2);
}
.nav-item.active {
  color: var(--gold);
  border-left-color: var(--gold);
  background: var(--gold-glow2);
}
.nav-icon { font-size: 15px; width: 18px; text-align: center; }
.nav-count {
  margin-left: auto;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  color: var(--dimmed);
}

.sentiment-mini {
  padding: 0 20px;
}
.s-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.s-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  color: var(--muted);
}
.s-bar-wrap {
  flex: 1;
  margin: 0 10px;
  height: 4px;
  background: var(--border2);
  border-radius: 2px;
  overflow: hidden;
}
.s-bar { height: 100%; border-radius: 2px; transition: width 0.8s ease; }
.s-val {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  width: 28px;
  text-align: right;
}

/* ── Main Feed ── */
.feed {
  padding: 28px 32px;
  overflow-y: auto;
  height: 100%;
  min-height: 0;
}
.feed-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 28px;
  animation: fadeUp 0.5s ease 0.1s both;
}
.feed-title {
  font-family: 'Syne', sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.5px;
}
.feed-title span { color: var(--gold); }
.feed-meta {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  color: var(--muted);
  letter-spacing: 1px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--card);
  border: 1px solid var(--border2);
  border-radius: 10px;
  padding: 10px 16px;
  margin-bottom: 28px;
  transition: border-color 0.2s;
  animation: fadeUp 0.5s ease 0.15s both;
}
.search-bar:focus-within {
  border-color: var(--gold-dim);
  box-shadow: 0 0 0 3px var(--gold-glow);
}
.search-bar input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-family: 'Lora', serif;
  font-size: 14px;
  color: var(--text);
}
.search-bar input::placeholder { color: var(--dimmed); }
.search-icon { color: var(--muted); font-size: 14px; }

/* Article Card */
.article-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 22px 24px;
  margin-bottom: 16px;
  transition: border-color 0.2s, transform 0.2s;
  cursor: pointer;
  animation: fadeUp 0.4s ease both;
  position: relative;
  overflow: hidden;
}
.article-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--border2);
  transition: background 0.2s;
}
.article-card:hover {
  border-color: var(--border2);
  transform: translateY(-2px);
}
.article-card:hover::before { background: var(--gold); }
.article-card.bullish::before { background: var(--green); }
.article-card.bearish::before { background: var(--red); }
.article-card.neutral::before { background: var(--blue); }

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.source-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--muted);
  text-transform: uppercase;
}
.card-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}
.badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  letter-spacing: 1px;
  padding: 3px 9px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 500;
}
.badge.bullish  { background: rgba(61,220,132,0.1); color: var(--green); border: 1px solid rgba(61,220,132,0.2); }
.badge.bearish  { background: rgba(255,95,87,0.1);  color: var(--red);   border: 1px solid rgba(255,95,87,0.2);  }
.badge.neutral  { background: rgba(79,158,255,0.1); color: var(--blue);  border: 1px solid rgba(79,158,255,0.2); }
.badge.category { background: var(--gold-glow); color: var(--gold); border: 1px solid rgba(201,168,76,0.2); }

.article-title {
  font-family: 'Syne', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.4;
  margin-bottom: 10px;
}
.article-desc {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.65;
  margin-bottom: 14px;
  font-style: italic;
}
.ai-summary {
  background: var(--gold-glow2);
  border: 1px solid rgba(201,168,76,0.15);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 14px;
  animation: slideIn 0.4s ease both;
}
.ai-summary-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--gold);
  text-transform: uppercase;
  margin-bottom: 6px;
}
.ai-summary-text {
  font-size: 13px;
  color: var(--text);
  line-height: 1.6;
}
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.article-time {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  color: var(--dimmed);
}
.read-link {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  color: var(--gold-dim);
  text-decoration: none;
  letter-spacing: 1px;
  transition: color 0.2s;
}
.read-link:hover { color: var(--gold); }

/* Loading skeleton */
.skeleton {
  background: linear-gradient(90deg, var(--card) 25%, var(--border) 50%, var(--card) 75%);
  background-size: 400px 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 6px;
}

/* ── Right Panel ── */
.right-panel {
  border-left: 1px solid var(--border);
  padding: 24px 20px;
  background: var(--surface);
  overflow-y: auto;
  height: 100%;
  min-height: 0;
}
.panel-section { margin-bottom: 32px; }
.panel-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  letter-spacing: 3px;
  color: var(--gold);
  text-transform: uppercase;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}

.trend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.15s;
}
.trend-item:hover .trend-word { color: var(--gold); }
.trend-rank {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: var(--dimmed);
  width: 20px;
}
.trend-word {
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  flex: 1;
  padding-left: 10px;
  transition: color 0.15s;
}
.trend-count {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  color: var(--muted);
}

.insight-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 10px;
}
.insight-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 6px;
}
.insight-value {
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: var(--text);
}
.insight-sub {
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
  font-style: italic;
}

.summary-box {
  background: var(--card);
  border: 1px solid var(--border);
  border-left: 3px solid var(--gold);
  border-radius: 10px;
  padding: 16px;
}
.summary-box-text {
  font-size: 13px;
  line-height: 1.7;
  color: var(--muted);
  font-style: italic;
}
.summary-loading {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: var(--dimmed);
  animation: pulse 1.5s ease infinite;
}

.error-state {
  text-align: center;
  padding: 60px 20px;
  animation: fadeUp 0.5s ease both;
}
.error-state h3 {
  font-family: 'Syne', sans-serif;
  font-size: 18px;
  color: var(--text);
  margin-bottom: 10px;
}
.error-state p {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.7;
}
.error-state code {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: var(--gold);
  background: var(--card);
  padding: 2px 8px;
  border-radius: 4px;
}

.cfg-banner {
  background: linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03));
  border: 1px solid rgba(201,168,76,0.2);
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 24px;
  animation: fadeUp 0.5s ease both;
}
.cfg-banner h4 {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: var(--gold);
  margin-bottom: 8px;
}
.cfg-banner p {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.6;
}
.cfg-banner a { color: var(--gold); }

@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .sidebar, .right-panel { display: none; }
}
`;

// ─── MOCK DATA (used when API keys not configured) ────────────────────────────
const MOCK_ARTICLES = [
  {
    title: "AI Startups Raise Record $42B in Q1 2026 as Enterprise Adoption Surges",
    description: "Venture capital flowing into artificial intelligence reached unprecedented levels this quarter, driven by enterprise deals and infrastructure buildout.",
    source: { name: "TechCrunch" },
    publishedAt: new Date(Date.now() - 18 * 60000).toISOString(),
    url: "#",
    category: "AI",
    sentiment: "bullish",
    aiSummary: "Record VC investment signals strong confidence in AI enterprise adoption. Infrastructure plays dominate the funding landscape, suggesting a maturation from pure software bets.",
  },
  {
    title: "Central Banks Signal Coordinated Rate Strategy Amid Global Inflation Concerns",
    description: "The Fed, ECB and Bank of England issued rare joint guidance hinting at synchronized monetary policy shifts expected in Q3.",
    source: { name: "Financial Times" },
    publishedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    url: "#",
    category: "Finance",
    sentiment: "bearish",
    aiSummary: "Coordinated central bank signaling reduces uncertainty but suggests rates staying elevated. Bond markets and emerging market currencies likely face headwinds into Q3.",
  },
  {
    title: "Romania's Tech Sector Grows 28% YoY, Cluj and Timișoara Lead Talent Surge",
    description: "Eastern European tech hubs are increasingly attracting multinational R&D centers, with Romania's engineering talent pool growing at twice the EU average.",
    source: { name: "Bloomberg" },
    publishedAt: new Date(Date.now() - 72 * 60000).toISOString(),
    url: "#",
    category: "Tech",
    sentiment: "bullish",
    aiSummary: "Romania's regional tech growth, particularly in Timișoara, positions the country as a credible alternative to Western European hubs. Strong talent pipeline and competitive costs drive expansion.",
  },
  {
    title: "Open Source LLMs Close Gap with Proprietary Models on Reasoning Benchmarks",
    description: "Meta's latest Llama release scores within 4% of GPT-4o on complex reasoning tasks, accelerating enterprise migration to self-hosted AI.",
    source: { name: "The Verge" },
    publishedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    url: "#",
    category: "AI",
    sentiment: "neutral",
    aiSummary: "Narrowing performance gap between open and closed source models will pressure proprietary AI pricing and accelerate on-premise deployment. Long-term bearish for API-dependent AI businesses.",
  },
  {
    title: "Telecom Giants Accelerate 6G Research Partnerships with University Labs",
    description: "Nokia, Ericsson and Samsung announced joint academic research programs targeting 6G deployment by 2030, with spectrum allocation talks beginning in Geneva.",
    source: { name: "Reuters" },
    publishedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    url: "#",
    category: "Telecom",
    sentiment: "neutral",
    aiSummary: "6G partnerships signal long investment cycles ahead. Companies positioning early in spectrum and standards will hold outsized advantage. Near-term impact minimal; 2028–2030 inflection point.",
  },
];

const CATEGORIES = [
  { id: "all",      label: "All Sources",   icon: "◈", q: "technology OR finance OR AI" },
  { id: "ai",       label: "Artificial Intelligence", icon: "⬡", q: "artificial intelligence OR machine learning OR LLM" },
  { id: "tech",     label: "Technology",    icon: "◎", q: "technology startup software" },
  { id: "finance",  label: "Finance",       icon: "◇", q: "financial markets economy banking" },
  { id: "telecom",  label: "Telecom",       icon: "◉", q: "telecommunications 5G network" },
  { id: "world",    label: "World",         icon: "○", q: "global politics international" },
];

const TICKER_ITEMS = [
  { label: "S&P 500",   val: "5,842.14", dir: "up",   chg: "+0.42%" },
  { label: "NASDAQ",    val: "18,234.56", dir: "up",  chg: "+0.61%" },
  { label: "BTC/USD",   val: "87,432",   dir: "down", chg: "-1.23%" },
  { label: "EUR/USD",   val: "1.0843",   dir: "up",   chg: "+0.08%" },
  { label: "10Y YIELD", val: "4.32%",    dir: "down", chg: "-0.03%" },
  { label: "WTI OIL",   val: "$72.14",   dir: "up",   chg: "+0.55%" },
  { label: "GOLD",      val: "$2,341",   dir: "up",   chg: "+0.18%" },
  { label: "VIX",       val: "16.42",    dir: "down", chg: "-2.10%" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1)  return "just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

function extractTrends(articles) {
  const stopwords = new Set(["the","a","an","in","on","at","of","to","for","is","are","was","were","with","and","or","but","not","that","this","it","be","as","by","from","has","have","had","will","would","could","should","its","their","they","we","you","i","he","she","how","what","when","where","who","why","new","more","over","after","about","up","said","says","says","also"]);
  const freq = {};
  articles.forEach(a => {
    const words = (a.title + " " + (a.description || "")).toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    words.forEach(w => {
      if (!stopwords.has(w)) freq[w] = (freq[w] || 0) + 1;
    });
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word: word.charAt(0).toUpperCase() + word.slice(1), count }));
}

function calcSentimentStats(articles) {
  const counts = { bullish: 0, bearish: 0, neutral: 0 };
  articles.forEach(a => { if (a.sentiment) counts[a.sentiment]++; });
  const total = articles.length || 1;
  return {
    bullish: Math.round((counts.bullish / total) * 100),
    bearish: Math.round((counts.bearish / total) * 100),
    neutral: Math.round((counts.neutral / total) * 100),
  };
}

// ─── GROQ: AI ANALYSIS ────────────────────────────────────────────────────────
async function analyzeWithGroq(article, groqKey) {
  if (!groqKey || groqKey.includes("YOUR_")) throw new Error("No key");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      max_tokens: 120,
      temperature: 0.3,
      messages: [{
        role: "user",
        content: `Analyze this news article in exactly 2 sentences. First sentence: key implication for tech/finance professionals. Second sentence: sentiment (bullish/bearish/neutral) with one-word reason. Be direct and concise.

Title: ${article.title}
Description: ${article.description || ""}

Respond with JSON: {"summary": "...", "sentiment": "bullish|bearish|neutral"}`
      }]
    })
  });
  if (!res.ok) throw new Error("Groq error");
  const data = await res.json();
  const text = data.choices[0].message.content;
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

async function generateBriefing(articles, groqKey) {
  if (!groqKey || groqKey.includes("YOUR_")) {
    return "Today's intelligence brief: AI investment momentum remains strong while central banks signal caution. Regional tech hubs in Eastern Europe are emerging as significant talent centers. Open-source AI is closing the gap with proprietary solutions faster than expected.";
  }
  try {
    const headlines = articles.slice(0, 8).map(a => a.title).join("; ");
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        max_tokens: 180,
        temperature: 0.4,
        messages: [{
          role: "user",
          content: `You are a senior analyst. Write a 3-sentence executive briefing summarizing the most important themes from today's headlines. Be direct, analytical, and professional. Return plain text only, no bullet points, no markdown.

Headlines: ${headlines}`
        }]
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn("Groq briefing error:", err);
      return "Briefing unavailable — Groq API returned an error. Check your API key or rate limit.";
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "No briefing generated.";
  } catch (e) {
    console.warn("generateBriefing failed:", e);
    return "Briefing unavailable — network error contacting Groq.";
  }
}

// ─── NEWSAPI FETCH ────────────────────────────────────────────────────────────
async function fetchNews(query, apiKey, page = 1) {
  if (!apiKey || apiKey.includes("YOUR_")) return null;
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=10&page=${page}&token=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0] || "GNews error");
  const articles = data.articles?.map(a => ({
    title: a.title,
    description: a.description,
    source: { name: a.source?.name },
    publishedAt: a.publishedAt,
    url: a.url,
  })) || [];
  return { articles, total: data.totalArticles || articles.length };
}

async function fetchCount(query, apiKey) {
  if (!apiKey || apiKey.includes("YOUR_")) return null;
  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=1&token=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.totalArticles || 0;
  } catch { return null; }
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function App() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [time, setTime] = useState(new Date());
  const [briefing, setBriefing] = useState("");
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [usingMock, setUsingMock] = useState(false);
  const analyzingRef = useRef(Symbol('init'));
  const [categoryCounts, setCategoryCounts] = useState({});

  // Fetch counts lazily — only for categories not yet counted, staggered to save API budget
  useEffect(() => {
    if (!CONFIG.NEWS_API_KEY || CONFIG.NEWS_API_KEY.includes("YOUR_")) return;
    const uncounted = CATEGORIES.filter(c => !categoryCounts[c.id]);
    if (!uncounted.length) return;
    let cancelled = false;
    const load = async () => {
      for (const cat of uncounted) {
        if (cancelled) break;
        const total = await fetchCount(cat.q, CONFIG.NEWS_API_KEY);
        if (total !== null && !cancelled) {
          setCategoryCounts(prev => ({ ...prev, [cat.id]: total }));
        }
        await new Promise(r => setTimeout(r, 600)); // stagger to avoid burst
      }
    };
    load();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Analyze all articles sequentially, updating UI as each completes
  const analyzeArticles = useCallback(async (articlesSnapshot, startIdx = 0) => {
    for (let i = startIdx; i < articlesSnapshot.length; i++) {
      if (analyzingRef.current !== articlesSnapshot) break; // stale run, abort
      try {
        const result = await analyzeWithGroq(articlesSnapshot[i], CONFIG.GROQ_API_KEY);
        setArticles(prev => prev.map((a, idx) =>
          idx === i ? { ...a, sentiment: result.sentiment, aiSummary: result.summary } : a
        ));
      } catch {
        const title = articlesSnapshot[i].title.toLowerCase();
        const sent = title.match(/surges?|rises?|gains?|growth|record|breakthrough|rally|jump/) ? "bullish"
          : title.match(/falls?|drops?|decline|crisis|warn|risk|concern|slump|crash/) ? "bearish" : "neutral";
        setArticles(prev => prev.map((a, idx) =>
          idx === i ? { ...a, sentiment: sent } : a
        ));
      }
      // Small delay to avoid hammering Groq rate limits (free tier: ~30 req/min)
      await new Promise(r => setTimeout(r, 300));
    }
  }, []);

  // Load articles — fetches up to 100 articles (pages 1–3 × 30 + remaining) on initial load
  const loadArticles = useCallback(async (cat) => {
    setLoading(true);
    setArticles([]);
    setBriefing("");
    analyzingRef.current = Symbol(); // invalidate any in-progress analysis loop

    const category = CATEGORIES.find(c => c.id === cat);
    let allArticles = [];
    let total = 0;

    try {
      // Fetch pages 1, 2, 3 in parallel for speed (3 × 30 = up to 90 articles)
      const [r1, r2, r3] = await Promise.all([
        fetchNews(category.q, CONFIG.NEWS_API_KEY, 1),
        fetchNews(category.q, CONFIG.NEWS_API_KEY, 2),
        fetchNews(category.q, CONFIG.NEWS_API_KEY, 3),
      ]);
      if (r1) { allArticles = [...(r1.articles||[]), ...(r2?.articles||[]), ...(r3?.articles||[])]; total = r1.total; }
      // Deduplicate by title
      const seen = new Set();
      allArticles = allArticles.filter(a => {
        if (seen.has(a.title)) return false;
        seen.add(a.title);
        return true;
      });
      if (total) setCategoryCounts(prev => ({ ...prev, [cat]: total }));
    } catch (e) { console.warn("fetchNews error:", e); }

    if (!allArticles.length) {
      const filtered = cat === "all" ? MOCK_ARTICLES :
        MOCK_ARTICLES.filter(a => a.category?.toLowerCase() === cat);
      const fallback = filtered.length ? filtered : MOCK_ARTICLES;
      setArticles(fallback);
      setUsingMock(true);
      setLoading(false);
      generateBriefing(fallback, CONFIG.GROQ_API_KEY).then(b => setBriefing(b)).catch(() => setBriefing('Briefing unavailable.'));
      return;
    }

    setUsingMock(false);
    const tagged = allArticles.map(a => ({ ...a, category: category.label, sentiment: null, aiSummary: null }));
    setArticles(tagged);
    setLoading(false);

    // Generate briefing from first 8 headlines
    setBriefingLoading(true);
    generateBriefing(tagged, CONFIG.GROQ_API_KEY)
      .then(b => setBriefing(b))
      .catch(e => { console.warn('Briefing error:', e); setBriefing('Briefing unavailable — check Groq API key or rate limit.'); })
      .finally(() => setBriefingLoading(false));

    // Analyze ALL articles — pass the ref token to detect if category changes mid-run
    const runToken = analyzingRef.current;
    for (let i = 0; i < tagged.length; i++) {
      if (analyzingRef.current !== runToken) break; // category changed, abort
      try {
        const result = await analyzeWithGroq(tagged[i], CONFIG.GROQ_API_KEY);
        setArticles(prev => prev.map((a, idx) =>
          idx === i ? { ...a, sentiment: result.sentiment, aiSummary: result.summary } : a
        ));
      } catch {
        const title = tagged[i].title.toLowerCase();
        const sent = title.match(/surges?|rises?|gains?|growth|record|breakthrough|rally|jump/) ? "bullish"
          : title.match(/falls?|drops?|decline|crisis|warn|risk|concern|slump|crash/) ? "bearish" : "neutral";
        setArticles(prev => prev.map((a, idx) =>
          idx === i ? { ...a, sentiment: sent } : a
        ));
      }
      await new Promise(r => setTimeout(r, 300)); // ~3 req/sec — safe for Groq free tier
    }
  }, [analyzeArticles]);

  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => { setPage(1); loadArticles(activeCategory); }, [activeCategory]);

  const loadMore = async () => {
    setLoadingMore(true);
    const category = CATEGORIES.find(c => c.id === activeCategory);
    try {
      const result = await fetchNews(category.q, CONFIG.NEWS_API_KEY, page + 1);
      const more = result?.articles;
      if (more && more.length > 0) {
        const startIdx = articles.length;
        const tagged = more.map(a => ({ ...a, category: category.label, sentiment: null, aiSummary: null }));
        setArticles(prev => [...prev, ...tagged]);
        setPage(p => p + 1);
        // Analyze new articles too
        const runToken = analyzingRef.current;
        for (let i = 0; i < tagged.length; i++) {
          if (analyzingRef.current !== runToken) break;
          const globalIdx = startIdx + i;
          try {
            const res = await analyzeWithGroq(tagged[i], CONFIG.GROQ_API_KEY);
            setArticles(prev => prev.map((a, idx) =>
              idx === globalIdx ? { ...a, sentiment: res.sentiment, aiSummary: res.summary } : a
            ));
          } catch {
            const title = tagged[i].title.toLowerCase();
            const sent = title.match(/surges?|rises?|gains?|growth|record|breakthrough|rally|jump/) ? "bullish"
              : title.match(/falls?|drops?|decline|crisis|warn|risk|concern|slump|crash/) ? "bearish" : "neutral";
            setArticles(prev => prev.map((a, idx) =>
              idx === globalIdx ? { ...a, sentiment: sent } : a
            ));
          }
          await new Promise(r => setTimeout(r, 300));
        }
      }
    } catch (e) { console.warn('Load more failed:', e); }
    setLoadingMore(false);
  };

  const filtered = articles.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.title?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      a.source?.name?.toLowerCase().includes(q)
    );
  });

  const trends = extractTrends(articles);
  const sentStats = calcSentimentStats(articles);
  const articleCounts = {};
  CATEGORIES.forEach(c => {
    articleCounts[c.id] = c.id === "all" ? articles.length :
      articles.filter(a => a.category?.toLowerCase().includes(c.id)).length;
  });

  return (
    <>
      <style>{STYLE}</style>

      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker-label">MARKETS</div>
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div className="ticker-track">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <div className="ticker-item" key={i}>
                {item.label} <span>{item.val}</span>
                <span className={item.dir}>{item.chg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="app-shell">
      <div className="header">
        <div className="brand">
          <div>
            <div className="brand-name">Pulse<em>AI</em></div>
            <div className="brand-tag">News Intelligence Platform</div>
          </div>
        </div>
        <div className="header-right">
          <div className="live-badge"><div className="live-dot" />LIVE</div>
          <div className="time-display">
            {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        </div>
      </div>

      <div className="layout">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Intelligence Feed</div>
            {CATEGORIES.map(c => (
              <div
                key={c.id}
                className={`nav-item ${activeCategory === c.id ? "active" : ""}`}
                onClick={() => setActiveCategory(c.id)}
              >
                <span className="nav-icon">{c.icon}</span>
                {c.label}
                <span className="nav-count">
                  {categoryCounts[c.id]
                    ? categoryCounts[c.id] >= 1000
                      ? (categoryCounts[c.id] / 1000).toFixed(1) + "k"
                      : categoryCounts[c.id]
                    : articleCounts[c.id] || "—"}
                </span>
              </div>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">Sentiment Overview</div>
            <div className="sentiment-mini">
              {[
                { label: "Bullish", pct: sentStats.bullish, color: "var(--green)" },
                { label: "Bearish", pct: sentStats.bearish, color: "var(--red)" },
                { label: "Neutral", pct: sentStats.neutral, color: "var(--blue)" },
              ].map(s => (
                <div className="s-row" key={s.label}>
                  <span className="s-label">{s.label}</span>
                  <div className="s-bar-wrap">
                    <div className="s-bar" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                  <span className="s-val" style={{ color: s.color }}>{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Feed */}
        <div className="feed">
          <div className="feed-header">
            <div>
              <div className="feed-title">
                {CATEGORIES.find(c => c.id === activeCategory)?.label} 
              </div>
            </div>
            <div className="feed-meta">
              {articles.length} LOADED
              {categoryCounts[activeCategory] ? ` · ${categoryCounts[activeCategory].toLocaleString()} TOTAL` : ""}
              {" · "}{usingMock ? "DEMO DATA" : "LIVE"}
            </div>
          </div>

      

          <div className="search-bar">
            <span className="search-icon">⌕</span>
            <input
              placeholder="Search headlines, topics, companies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading && !search ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div className="article-card" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="skeleton" style={{ height: 12, width: "30%", marginBottom: 14 }} />
                <div className="skeleton" style={{ height: 18, width: "85%", marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: "70%", marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: "60%" }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="error-state">
              <h3>No results found</h3>
              <p>Try a different search term or category.</p>
            </div>
          ) : (
            filtered.map((article, i) => (
              <div
                key={i}
                className={`article-card ${article.sentiment || ""}`}
                style={{ animationDelay: `${i * 0.06}s` }}
                onClick={() => article.url !== "#" && window.open(article.url, "_blank")}
              >
                <div className="card-top">
                  <span className="source-badge">{article.source?.name || "Unknown"}</span>
                  <div className="card-badges">
                    {article.category && <span className="badge category">{article.category}</span>}
                    {article.sentiment && (
                      <span className={`badge ${article.sentiment}`}>
                        {article.sentiment === "bullish" ? "↑ Bullish" : article.sentiment === "bearish" ? "↓ Bearish" : "→ Neutral"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="article-title">{article.title}</div>

                {article.description && (
                  <div className="article-desc">{article.description}</div>
                )}

                {article.aiSummary && (
                  <div className="ai-summary">
                    <div className="ai-summary-label">⬡ AI Analysis</div>
                    <div className="ai-summary-text">{article.aiSummary}</div>
                  </div>
                )}

                <div className="card-footer">
                  <span className="article-time">{timeAgo(article.publishedAt)}</span>
                  {article.url !== "#" && (
                    <a className="read-link" href={article.url} target="_blank" rel="noreferrer"
                      onClick={e => e.stopPropagation()}>
                      READ FULL →
                    </a>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Load More */}
          {!usingMock && !loading && filtered.length > 0 && (
            <div style={{ textAlign: "center", padding: "24px 0 8px" }}>
              <button
                onClick={loadMore}
                disabled={loadingMore}
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border2)",
                  borderRadius: "10px",
                  padding: "12px 32px",
                  color: loadingMore ? "var(--dimmed)" : "var(--gold)",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "2px",
                  cursor: loadingMore ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {loadingMore ? "⟳  LOADING..." : "LOAD MORE STORIES →"}
              </button>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <div className="panel-section">
            <div className="panel-title">Executive Briefing</div>
            <div className="summary-box">
              {briefingLoading ? (
                <div className="summary-loading">⟳ Generating briefing...</div>
              ) : briefing ? (
                <div className="summary-box-text">{briefing}</div>
              ) : (
                <div className="summary-loading">Awaiting data...</div>
              )}
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-title">Today at a Glance</div>
            <div className="insight-card">
              <div className="insight-label">Articles Analyzed</div>
              <div className="insight-value">{articles.length}</div>
              <div className="insight-sub">Across {CATEGORIES.length - 1} categories</div>
            </div>
            <div className="insight-card">
              <div className="insight-label">Market Mood</div>
              <div className="insight-value" style={{
                color: sentStats.bullish > sentStats.bearish ? "var(--green)"
                  : sentStats.bearish > sentStats.bullish ? "var(--red)" : "var(--blue)",
                fontSize: 16
              }}>
                {sentStats.bullish > sentStats.bearish ? "↑ Risk-On"
                  : sentStats.bearish > sentStats.bullish ? "↓ Risk-Off" : "→ Mixed"}
              </div>
              <div className="insight-sub">{sentStats.bullish}% positive signals</div>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-title">Trending Topics</div>
            {trends.map((t, i) => (
              <div className="trend-item" key={i}
                onClick={() => setSearch(t.word)}>
                <span className="trend-rank">#{i + 1}</span>
                <span className="trend-word">{t.word}</span>
                <span className="trend-count">{t.count}×</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>{/* end app-shell */}
    </>
  );
}
