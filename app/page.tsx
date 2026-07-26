"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Tab = "chat" | "timeline" | "report";
type Urgency = "monitor" | "soon" | "emergency";

type MediaItem = {
  id: string;
  name: string;
  mime: string;
  kind: "image" | "video";
  blob: Blob;
};

type TimelineEntry = {
  id: string;
  category: string;
  title: string;
  note: string;
  observedAt: string;
  icon: string;
  tone: "sage" | "peach" | "blue" | "yellow";
  media: MediaItem[];
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
};

type AppData = {
  timeline: TimelineEntry[];
  chats: ChatMessage[];
};

const symptomOptions = [
  "Fever",
  "Cough or breathing",
  "Rash or skin change",
  "Vomiting",
  "Diarrhea",
  "Feeding concern",
  "Sleep or behavior change",
  "Other",
];

const categoryMeta: Record<string, { icon: string; tone: TimelineEntry["tone"] }> = {
  Fever: { icon: "°", tone: "peach" },
  "Cough or breathing": { icon: "≈", tone: "blue" },
  "Rash or skin change": { icon: "✦", tone: "peach" },
  Vomiting: { icon: "↗", tone: "yellow" },
  Diarrhea: { icon: "≋", tone: "yellow" },
  "Feeding concern": { icon: "◇", tone: "sage" },
  "Sleep or behavior change": { icon: "☾", tone: "blue" },
  Other: { icon: "•", tone: "sage" },
};

const sampleTimeline: TimelineEntry[] = [
  {
    id: "sample-feeding",
    category: "Feeding concern",
    title: "Morning bottle",
    note: "Finished her usual 120 mL bottle. Alert and smiling afterward.",
    observedAt: "2026-07-26T07:40:00",
    icon: "◇",
    tone: "sage",
    media: [],
  },
  {
    id: "sample-rash",
    category: "Rash or skin change",
    title: "Skin redness",
    note: "Small pink patch on her left cheek after her nap. It has not spread and does not seem to bother her.",
    observedAt: "2026-07-25T20:15:00",
    icon: "✦",
    tone: "peach",
    media: [],
  },
  {
    id: "sample-temp",
    category: "Fever",
    title: "Temperature check",
    note: "37.4°C measured underarm. Feeding normally and six wet diapers today.",
    observedAt: "2026-07-24T19:30:00",
    icon: "°",
    tone: "yellow",
    media: [],
  },
  {
    id: "sample-sleep",
    category: "Sleep or behavior change",
    title: "Longer afternoon nap",
    note: "Slept 25 minutes longer than usual, then woke easily and was playful.",
    observedAt: "2026-07-22T15:10:00",
    icon: "☾",
    tone: "blue",
    media: [],
  },
];

const sampleChats: ChatMessage[] = [
  {
    id: "chat-1",
    role: "user",
    text: "Mila’s cheek looks a little pink after her nap. She seems comfortable—what should I keep an eye on?",
    time: "Yesterday · 8:24 PM",
  },
  {
    id: "chat-2",
    role: "assistant",
    text: "It’s reassuring that she seems comfortable and the area has not spread. Add a clear photo if you can, and watch for fast spreading, swelling around the eyes or mouth, breathing changes, fever, unusual sleepiness, or feeding changes. Those signs would mean getting medical help sooner.",
    time: "Yesterday · 8:24 PM",
  },
  {
    id: "chat-3",
    role: "user",
    text: "Her feeding and wet diapers are still normal.",
    time: "Yesterday · 8:26 PM",
  },
  {
    id: "chat-4",
    role: "assistant",
    text: "That context is helpful. I’ve noted that feeding and hydration are unchanged. Keep tracking the patch and how Mila is acting overall, and use the urgency check if anything changes.",
    time: "Yesterday · 8:26 PM",
  },
];

const fallbackData: AppData = { timeline: sampleTimeline, chats: sampleChats };
const DB_NAME = "infant-symptom-support";
const STORE_NAME = "local-records";
const APP_KEY = "mila-profile";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readStoredData(): Promise<AppData | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(APP_KEY);
    request.onsuccess = () => resolve((request.result as AppData | undefined) ?? null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

async function writeStoredData(data: AppData) {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(data, APP_KEY);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

function formatEntryDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const day = sameDay(date, today)
    ? "Today"
    : sameDay(date, yesterday)
      ? "Yesterday"
      : date.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  return `${day} · ${date.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}`;
}

function MediaPreview({ item }: { item: MediaItem }) {
  const url = useMemo(() => URL.createObjectURL(item.blob), [item.blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return item.kind === "image" ? (
    <img className="entry-media" src={url} alt={item.name} />
  ) : (
    <video className="entry-media" src={url} controls aria-label={item.name} />
  );
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <img src="/calmcradle-logo.png" alt="" />
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [data, setData] = useState<AppData>(fallbackData);
  const [hydrated, setHydrated] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [urgencyOpen, setUrgencyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [urgencyResult, setUrgencyResult] = useState<Urgency | null>(null);
  const [timelineFilter, setTimelineFilter] = useState("All");
  const [chatInput, setChatInput] = useState("");
  const [chatImage, setChatImage] = useState<File | null>(null);
  const [chatBusy, setChatBusy] = useState(false);
  const [scriptStep, setScriptStep] = useState(0);
  const [toast, setToast] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    readStoredData()
      .then((stored) => {
        if (stored) setData(stored);
        else return writeStoredData(fallbackData);
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => void writeStoredData(data), 150);
    return () => window.clearTimeout(timer);
  }, [data, hydrated]);

  useEffect(() => {
    if (activeTab === "chat") chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.chats, activeTab]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleTimeline =
    timelineFilter === "All"
      ? data.timeline
      : data.timeline.filter((entry) => entry.category === timelineFilter);

  function goTo(tab: Tab) {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNewLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const category = String(form.get("category"));
    const note = String(form.get("note")).trim();
    const title = String(form.get("title")).trim() || category;
    const files = form.getAll("media").filter((item): item is File => item instanceof File && item.size > 0);
    const media: MediaItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      mime: file.type,
      kind: file.type.startsWith("video/") ? "video" : "image",
      blob: file,
    }));
    const meta = categoryMeta[category] ?? categoryMeta.Other;
    const entry: TimelineEntry = {
      id: crypto.randomUUID(),
      category,
      title,
      note,
      observedAt: String(form.get("observedAt")) || new Date().toISOString(),
      icon: meta.icon,
      tone: meta.tone,
      media,
    };
    setData((current) => ({ ...current, timeline: [entry, ...current.timeline] }));
    setLogOpen(false);
    setToast("Symptom update saved to Mila’s timeline.");
    event.currentTarget.reset();
  }

  function evaluateUrgency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const emergency =
      form.get("breathing") === "yes" ||
      form.get("wake") === "yes" ||
      form.get("seizure") === "yes";
    const soon =
      form.get("feeding") === "yes" ||
      form.get("wetDiapers") === "yes" ||
      Number(form.get("temperature") || 0) >= 38;
    setUrgencyResult(emergency ? "emergency" : soon ? "soon" : "monitor");
  }

  async function fileToDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function sendChat(messageOverride?: string) {
    const text = (messageOverride ?? chatInput).trim();
    if (!text || chatBusy) return;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      time: "Just now",
    };
    setData((current) => ({ ...current, chats: [...current.chats, userMessage] }));
    setChatInput("");
    setChatBusy(true);
    try {
      const image = chatImage ? await fileToDataUrl(chatImage) : undefined;
      setChatImage(null);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          image,
          scriptStep,
          history: data.chats.slice(-8).map(({ role, text: content }) => ({ role, content })),
          timeline: data.timeline.slice(0, 6).map(({ category, title, note, observedAt }) => ({
            category,
            title,
            note,
            observedAt,
          })),
        }),
      });
      const payload = (await response.json()) as { reply?: string };
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: payload.reply || "I’m here with you. Tell me what you’ve noticed and when it started.",
        time: "Just now",
      };
      setData((current) => ({ ...current, chats: [...current.chats, assistantMessage] }));
      setScriptStep((step) => (step + 1) % 5);
    } catch {
      setData((current) => ({
        ...current,
        chats: [
          ...current.chats,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: "Sure, I’ll take a look. What have you noticed, and when did it begin?",
            time: "Just now",
          },
        ],
      }));
    } finally {
      setChatBusy(false);
    }
  }

  async function downloadReport() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 48;
    let y = 52;
    const writeWrapped = (text: string, size = 10, gap = 15, width = 510) => {
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, width);
      doc.text(lines, margin, y);
      y += lines.length * gap;
    };
    const newPageIfNeeded = (height = 80) => {
      if (y + height > 735) {
        doc.addPage();
        y = 52;
      }
    };
    doc.setFillColor(38, 91, 80);
    doc.roundedRect(36, 30, 540, 92, 12, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.text("CalmCradle · Infant Symptom Summary", margin, 64);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Prepared for Mila · 5 months old", margin, 84);
    doc.text(`Generated ${new Date().toLocaleDateString("en-CA", { dateStyle: "long" })}`, margin, 101);
    y = 150;
    doc.setTextColor(37, 48, 44);
    doc.setFont("helvetica", "bold");
    writeWrapped("At a glance", 13, 17);
    doc.setFont("helvetica", "normal");
    writeWrapped(
      "Recent notes describe a localized pink patch on the left cheek. Feeding, wet diapers, alertness, and behavior have remained normal in the recorded entries.",
      10,
      15,
    );
    y += 8;
    doc.setFont("helvetica", "bold");
    writeWrapped("Recent symptom timeline", 13, 17);
    for (const entry of data.timeline.slice(0, 8)) {
      newPageIfNeeded();
      doc.setFont("helvetica", "bold");
      writeWrapped(`${entry.title} · ${formatEntryDate(entry.observedAt)}`, 10, 15);
      doc.setFont("helvetica", "normal");
      writeWrapped(`${entry.category}: ${entry.note}`, 9.5, 14);
      if (entry.media.length) writeWrapped(`${entry.media.length} media file(s) stored in the parent’s local timeline.`, 8.5, 13);
      y += 8;
    }
    newPageIfNeeded(130);
    doc.setFont("helvetica", "bold");
    writeWrapped("Recent conversation summary", 13, 17);
    doc.setFont("helvetica", "normal");
    writeWrapped(
      "The caregiver asked about mild cheek redness. The assistant noted the unchanged feeding and hydration entries and suggested monitoring for spreading, swelling, breathing changes, fever, unusual sleepiness, or feeding changes.",
      9.5,
      14,
    );
    y += 10;
    doc.setDrawColor(220, 219, 210);
    doc.line(margin, y, 564, y);
    y += 18;
    doc.setTextColor(95, 102, 98);
    writeWrapped(
      "This report organizes caregiver observations and is not a diagnosis. Urgency guidance in this prototype has not been clinically validated.",
      8.5,
      13,
    );
    doc.save("mila-symptom-summary.pdf");
    setToast("Doctor report downloaded.");
  }

  function resetSampleData() {
    setData({ timeline: sampleTimeline, chats: sampleChats });
    setSettingsOpen(false);
    setToast("Sample profile restored.");
  }

  function deleteAllData() {
    if (!window.confirm("Delete every symptom log, chat, image, and video stored on this device?")) return;
    setData({ timeline: [], chats: [] });
    setSettingsOpen(false);
    setToast("All local records have been deleted.");
  }

  return (
    <main className="app-shell">
      <aside className="side-nav">
        <div className="brand">
          <BrandMark />
          <div>
            <strong>CalmCradle</strong>
          </div>
        </div>
        <nav aria-label="Primary navigation">
          <NavButton active={activeTab === "chat"} icon="◌" label="Assistant" onClick={() => goTo("chat")} />
          <NavButton active={activeTab === "timeline"} icon="≡" label="Timeline" onClick={() => goTo("timeline")} />
          <NavButton active={activeTab === "report"} icon="□" label="Doctor report" onClick={() => goTo("report")} />
        </nav>
        <div className="privacy-note">
          <span className="privacy-icon">⌁</span>
          <div>
            <strong>Private by design</strong>
            <p>Your records stay on this device.</p>
          </div>
        </div>
        <button className="profile-chip" onClick={() => setSettingsOpen(true)} aria-label="Open Mila’s profile and privacy settings">
          <span className="avatar">M</span>
          <span><strong>Mila</strong><small>5 months old</small></span>
          <span aria-hidden="true">•••</span>
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <button className="mobile-brand" onClick={() => goTo("chat")} aria-label="Go to Assistant">
            <BrandMark /><span>CalmCradle</span>
          </button>
          <div className="top-actions">
            <button className="avatar-button" onClick={() => setSettingsOpen(true)} aria-label="Open settings">M</button>
          </div>
        </header>

        <div className="content">
          {activeTab === "timeline" && (
            <section className="page-panel">
              <div className="page-title-row">
                <div><p className="eyebrow">SYMPTOM HISTORY</p><h1>Mila’s timeline</h1><p>One calm, chronological view of symptoms, routines, and changes.</p></div>
                <button className="primary-button" onClick={() => setLogOpen(true)}><span>＋</span> Add an update</button>
              </div>
              <div className="filter-row" aria-label="Filter timeline">
                {["All", "Fever", "Rash or skin change", "Feeding concern", "Sleep or behavior change"].map((filter) => (
                  <button key={filter} className={timelineFilter === filter ? "active" : ""} onClick={() => setTimelineFilter(filter)}>{filter === "Rash or skin change" ? "Skin" : filter === "Feeding concern" ? "Feeding" : filter === "Sleep or behavior change" ? "Sleep" : filter}</button>
                ))}
              </div>
              {visibleTimeline.length ? (
                <div className="timeline-list">{visibleTimeline.map((entry) => <TimelineCard key={entry.id} entry={entry} expanded />)}</div>
              ) : (
                <div className="empty-state"><span>♡</span><h2>No updates here yet</h2><p>Add a symptom or observation when you’re ready.</p><button className="primary-button" onClick={() => setLogOpen(true)}>Add first update</button></div>
              )}
            </section>
          )}

          {activeTab === "chat" && (
            <section className="chat-layout chat-home">
              <div className="chat-main">
                <div className="chat-header">
                  <div className="assistant-avatar">✦</div>
                  <div>
                    <p className="eyebrow">MILA · 5 MONTHS</p>
                    <h1>What’s on your mind?</h1>
                    <p>Talk through a new concern or ask about something that has changed over time.</p>
                  </div>
                </div>
                <div className="context-strip"><span>⌁</span><p><strong>Timeline connected</strong> Recent symptoms and selected images can be considered in this conversation.</p></div>
                <div className="messages" aria-live="polite">
                  <div className="date-divider"><span>Previous conversation · Yesterday</span></div>
                  {data.chats.map((message) => (
                    <div key={message.id} className={`message-row ${message.role}`}>
                      {message.role === "assistant" && <div className="mini-assistant">✦</div>}
                      <div className="message-bubble"><p>{message.text}</p><time>{message.time}</time></div>
                    </div>
                  ))}
                  {chatBusy && <div className="message-row assistant"><div className="mini-assistant">✦</div><div className="typing" aria-label="Assistant is responding"><i></i><i></i><i></i></div></div>}
                  <div ref={chatEndRef} />
                </div>
                <div className="suggestions">
                  <button onClick={() => void sendChat("What has changed since yesterday?")}>What has changed since yesterday?</button>
                  <button onClick={() => void sendChat("What should I watch for tonight?")}>What should I watch for tonight?</button>
                </div>
                <div className="composer">
                  {chatImage && <div className="attachment-chip">▧ {chatImage.name}<button onClick={() => setChatImage(null)} aria-label="Remove attached image">×</button></div>}
                  <div className="composer-row">
                    <label className="attach-button" aria-label="Attach an image">
                      <span>＋</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setChatImage(event.target.files?.[0] ?? null)} />
                    </label>
                    <textarea value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendChat(); } }} placeholder="Ask anything about Mila…" rows={1} aria-label="Message" />
                    <button className="send-button" onClick={() => void sendChat()} disabled={!chatInput.trim() || chatBusy} aria-label="Send message">↑</button>
                  </div>
                  <p>Educational support only. This assistant cannot diagnose your infant.</p>
                </div>
              </div>
              <aside className="chat-context">
                <div className="mila-summary">
                  <span className="avatar">M</span>
                  <div><p className="eyebrow">TODAY</p><h2>Mila’s context</h2><small>{data.timeline.length} updates available to the assistant</small></div>
                </div>
                <div className="home-status">
                  <span className="status-dot">✓</span>
                  <div><small>LATEST SAFETY CHECK</small><strong>Monitoring at home</strong></div>
                </div>
                <div className="context-actions">
                  <button className="primary-button" onClick={() => setLogOpen(true)}>＋ Add an update</button>
                  <button className="outline-button" onClick={() => { setUrgencyResult(null); setUrgencyOpen(true); }}>Check urgency</button>
                </div>
                <div className="context-heading">
                  <p className="eyebrow">RECENT TIMELINE</p>
                  <button onClick={() => goTo("timeline")}>See all →</button>
                </div>
                {data.timeline.slice(0, 3).map((entry) => (
                  <div className="context-item" key={entry.id}><span className={`entry-icon ${entry.tone}`}>{entry.icon}</span><div><strong>{entry.title}</strong><small>{formatEntryDate(entry.observedAt)}</small></div></div>
                ))}
              </aside>
            </section>
          )}

          {activeTab === "report" && (
            <section className="report-page">
              <div className="page-title-row">
                <div><p className="eyebrow">FOR YOUR CARE TEAM</p><h1>Doctor report</h1><p>A concise summary of the observations you have recorded.</p></div>
                <button className="primary-button" onClick={() => void downloadReport()}><span>↓</span> Download PDF</button>
              </div>
              <div className="report-layout">
                <article className="report-paper">
                  <div className="report-top"><div><p className="eyebrow">INFANT SYMPTOM SUMMARY</p><h2>Mila</h2><span>5 months old · Generated today</span></div><BrandMark /></div>
                  <div className="report-alert"><span>i</span><p><strong>Caregiver-prepared summary</strong>This document organizes observations and does not provide a diagnosis.</p></div>
                  <ReportSection number="01" title="At a glance">
                    <p>Recent notes describe a localized pink patch on the left cheek. Feeding, wet diapers, alertness, and behavior have remained normal in the recorded entries.</p>
                    <div className="report-stats"><span><small>Latest safety level</small><strong>Monitor at home</strong></span><span><small>Updates recorded</small><strong>{data.timeline.length}</strong></span><span><small>Media attached</small><strong>{data.timeline.reduce((sum, entry) => sum + entry.media.length, 0)}</strong></span></div>
                  </ReportSection>
                  <ReportSection number="02" title="Recent timeline">
                    {data.timeline.slice(0, 4).map((entry) => <div className="report-entry" key={entry.id}><time>{formatEntryDate(entry.observedAt)}</time><div><strong>{entry.title}</strong><p>{entry.note}</p></div></div>)}
                  </ReportSection>
                  <ReportSection number="03" title="Conversation summary">
                    <p>The caregiver asked about mild cheek redness. The assistant considered the unchanged feeding and hydration entries and suggested monitoring for spreading, swelling, breathing changes, fever, unusual sleepiness, or feeding changes.</p>
                  </ReportSection>
                </article>
                <aside className="report-options">
                  <div className="option-card"><span>✓</span><div><strong>Ready to share</strong><p>Formatted for a quick clinical review.</p></div></div>
                  <div className="option-card"><span>⌁</span><div><strong>Private until you share</strong><p>The PDF is generated on this device.</p></div></div>
                  <p className="tiny-note">Images and videos remain in the local timeline and are referenced by file count.</p>
                </aside>
              </div>
            </section>
          )}
        </div>
      </section>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        <NavButton active={activeTab === "chat"} icon="◌" label="Assistant" onClick={() => goTo("chat")} />
        <NavButton active={activeTab === "timeline"} icon="≡" label="Timeline" onClick={() => goTo("timeline")} />
        <button className="mobile-add" onClick={() => setLogOpen(true)} aria-label="Add symptom update">＋</button>
        <NavButton active={activeTab === "report"} icon="□" label="Report" onClick={() => goTo("report")} />
      </nav>

      {logOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLogOpen(false); }}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="log-title">
            <button className="close-button" onClick={() => setLogOpen(false)} aria-label="Close">×</button>
            <p className="eyebrow">NEW TIMELINE UPDATE</p><h2 id="log-title">What did you notice?</h2><p>Record the details in your own words. Photos can be interpreted in chat; videos are stored only.</p>
            <form onSubmit={handleNewLog}>
              <label>Symptom or observation<select name="category" defaultValue="Rash or skin change">{symptomOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label>Short title<input name="title" placeholder="e.g. Pink patch on cheek" /></label>
              <label>What happened?<textarea name="note" required rows={4} placeholder="Describe what you noticed and how Mila was acting…" /></label>
              <label>When did you notice it?<input name="observedAt" type="datetime-local" defaultValue="2026-07-26T09:15" /></label>
              <label className="upload-zone"><span>＋</span><strong>Add photos or videos</strong><small>Images up to 10 MB · videos up to 50 MB</small><input name="media" type="file" accept="image/*,video/*" multiple onChange={validateFiles} /></label>
              <div className="modal-actions"><button type="button" className="text-button" onClick={() => setLogOpen(false)}>Cancel</button><button className="primary-button" type="submit">Save to timeline</button></div>
            </form>
          </section>
        </div>
      )}

      {urgencyOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setUrgencyOpen(false); }}>
          <section className="modal-card urgency-modal" role="dialog" aria-modal="true" aria-labelledby="urgency-title">
            <button className="close-button" onClick={() => setUrgencyOpen(false)} aria-label="Close">×</button>
            {!urgencyResult ? (
              <>
                <p className="eyebrow">DEMONSTRATION SAFETY CHECK</p><h2 id="urgency-title">Let’s check what Mila needs</h2><p>Answer based on what you see right now. These prototype rules are not clinically validated.</p>
                <form onSubmit={evaluateUrgency}>
                  <label>What is the main concern?<select name="category">{symptomOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
                  <label>Temperature in °C, if measured<input name="temperature" type="number" step="0.1" placeholder="e.g. 37.4" /></label>
                  <YesNo name="breathing" label="Is Mila struggling to breathe or are her lips blue?" />
                  <YesNo name="wake" label="Is she very difficult to wake or unusually floppy?" />
                  <YesNo name="seizure" label="Has she had a seizure?" />
                  <YesNo name="feeding" label="Is she refusing several feeds or vomiting repeatedly?" />
                  <YesNo name="wetDiapers" label="Are there far fewer wet diapers than usual?" />
                  <button className="primary-button full-button" type="submit">Show next step</button>
                </form>
              </>
            ) : (
              <UrgencyResult result={urgencyResult} onAgain={() => setUrgencyResult(null)} />
            )}
          </section>
        </div>
      )}

      {settingsOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
          <section className="modal-card settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <button className="close-button" onClick={() => setSettingsOpen(false)} aria-label="Close">×</button>
            <div className="profile-large"><span className="avatar">M</span><div><p className="eyebrow">INFANT PROFILE</p><h2 id="settings-title">Mila</h2><p>Born February 14, 2026 · 5 months old</p></div></div>
            <div className="settings-block"><strong>Local privacy</strong><p>Symptoms, chats, images, and videos are stored only in this browser. Selected text and images are sent to the assistant when you start a chat.</p></div>
            <button className="outline-button full-button" onClick={resetSampleData}>Restore sample profile</button>
            <button className="danger-button" onClick={deleteAllData}>Delete all local records</button>
          </section>
        </div>
      )}
      {toast && <div className="toast" role="status">✓ {toast}</div>}
    </main>
  );
}

function validateFiles(event: ChangeEvent<HTMLInputElement>) {
  const files = Array.from(event.target.files ?? []);
  const tooLarge = files.find((file) => file.size > (file.type.startsWith("video/") ? 50 : 10) * 1024 * 1024);
  if (tooLarge) {
    window.alert(`${tooLarge.name} is too large for this prototype.`);
    event.target.value = "";
  }
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return <button className={`nav-button ${active ? "active" : ""}`} onClick={onClick}><span>{icon}</span><b>{label}</b></button>;
}

function TimelineCard({ entry, expanded = false }: { entry: TimelineEntry; expanded?: boolean }) {
  return (
    <article className="timeline-card">
      <span className={`entry-icon ${entry.tone}`}>{entry.icon}</span>
      <div className="entry-body">
        <div className="entry-heading"><div><h3>{entry.title}</h3><span>{entry.category}</span></div><time>{formatEntryDate(entry.observedAt)}</time></div>
        <p>{entry.note}</p>
        {entry.media.length > 0 && <div className={`media-grid ${expanded ? "" : "compact-media"}`}>{entry.media.map((item) => <MediaPreview item={item} key={item.id} />)}</div>}
      </div>
    </article>
  );
}

function YesNo({ name, label }: { name: string; label: string }) {
  return <fieldset className="yes-no"><legend>{label}</legend><label><input type="radio" name={name} value="no" defaultChecked /> No</label><label><input type="radio" name={name} value="yes" /> Yes</label></fieldset>;
}

function UrgencyResult({ result, onAgain }: { result: Urgency; onAgain: () => void }) {
  const content = {
    monitor: {
      label: "Monitor at home",
      icon: "✓",
      intro: "Nothing you selected triggered a higher-level action in this demonstration check.",
      action: "Keep recording changes and check again if Mila seems different.",
      watch: ["Trouble breathing or blue lips", "Difficult to wake or unusually floppy", "Feeding much less or far fewer wet diapers"],
    },
    soon: {
      label: "Contact a healthcare professional soon",
      icon: "↗",
      intro: "One or more answers suggest that a qualified healthcare professional should review the situation.",
      action: "Call your pediatrician, primary-care clinic, or local health advice line.",
      watch: ["Symptoms getting worse quickly", "New breathing difficulty", "Increasing sleepiness or reduced responsiveness"],
    },
    emergency: {
      label: "Seek emergency care now",
      icon: "!",
      intro: "A potentially serious warning sign was selected.",
      action: "Call 911 or your local emergency service now. Do not rely on this app while waiting for help.",
      watch: ["Stay with your infant", "Follow the emergency operator’s instructions", "Bring recent symptom information if it is safe to do so"],
    },
  }[result];
  return (
    <div className={`urgency-result ${result}`}>
      <div className="result-icon">{content.icon}</div><p className="eyebrow">RECOMMENDED NEXT STEP</p><h2 id="urgency-title">{content.label}</h2><p>{content.intro}</p>
      <div className="action-box"><strong>What to do</strong><p>{content.action}</p></div>
      <div className="result-watch"><strong>{result === "emergency" ? "While getting help" : "What to watch for"}</strong>{content.watch.map((item) => <span key={item}>• {item}</span>)}</div>
      <p className="prototype-warning">Prototype guidance only · Not clinically validated</p>
      <button className="outline-button full-button" onClick={onAgain}>Check again</button>
    </div>
  );
}

function ReportSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <section className="report-section"><div className="report-section-title"><span>{number}</span><h3>{title}</h3></div>{children}</section>;
}
