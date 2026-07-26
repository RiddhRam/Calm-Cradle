"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Tab = "chat" | "timeline" | "forum" | "report";
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
  intensity: "mild" | "moderate" | "significant";
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

type ForumReply = {
  id: string;
  author: string;
  initials: string;
  babyAge: string;
  body: string;
  createdAt: string;
  media: MediaItem[];
};

type ForumPost = {
  id: string;
  author: string;
  initials: string;
  babyAge: string;
  title: string;
  body: string;
  topic: "Sleep" | "Feeding" | "Skin" | "Development" | "Everyday";
  createdAt: string;
  likes: number;
  replies: ForumReply[];
  media: MediaItem[];
};

type AppData = {
  timeline: TimelineEntry[];
  chats: ChatMessage[];
  forumPosts: ForumPost[];
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
  Fever: { icon: "🌡", tone: "peach" },
  "Cough or breathing": { icon: "🫁", tone: "blue" },
  "Rash or skin change": { icon: "🩹", tone: "peach" },
  Vomiting: { icon: "🤢", tone: "yellow" },
  Diarrhea: { icon: "💧", tone: "yellow" },
  "Feeding concern": { icon: "🍼", tone: "sage" },
  "Sleep or behavior change": { icon: "☾", tone: "blue" },
  Other: { icon: "＋", tone: "sage" },
};

const sampleTimeline: TimelineEntry[] = [
  {
    id: "sample-feeding",
    category: "Feeding concern",
    title: "Morning bottle",
    note: "Finished her usual 120 mL bottle. Alert and smiling afterward.",
    observedAt: "2026-07-26T07:40:00",
    intensity: "mild",
    icon: "🍼",
    tone: "sage",
    media: [],
  },
  {
    id: "sample-rash",
    category: "Rash or skin change",
    title: "Skin redness",
    note: "Small pink patch on her left cheek after her nap. It has not spread and does not seem to bother her.",
    observedAt: "2026-07-25T20:15:00",
    intensity: "moderate",
    icon: "🩹",
    tone: "peach",
    media: [],
  },
  {
    id: "sample-temp",
    category: "Fever",
    title: "Temperature check",
    note: "37.4°C measured underarm. Feeding normally and six wet diapers today.",
    observedAt: "2026-07-24T19:30:00",
    intensity: "mild",
    icon: "🌡",
    tone: "yellow",
    media: [],
  },
  {
    id: "sample-sleep",
    category: "Sleep or behavior change",
    title: "Longer afternoon nap",
    note: "Slept 25 minutes longer than usual, then woke easily and was playful.",
    observedAt: "2026-07-22T15:10:00",
    intensity: "mild",
    icon: "☾",
    tone: "blue",
    media: [],
  },
];

const sampleChats: ChatMessage[] = [
  {
    id: "chat-1",
    role: "user",
    text: "Sophie’s cheek looks a little pink after her nap. She seems comfortable—what should I keep an eye on?",
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
    text: "That context is helpful. I’ve noted that feeding and hydration are unchanged. Keep tracking the patch and how Sophie is acting overall, and use the urgency check if anything changes.",
    time: "Yesterday · 8:26 PM",
  },
];

const sampleForumPosts: ForumPost[] = [
  {
    id: "forum-sleep",
    author: "Sofia M.",
    initials: "SM",
    babyAge: "Noah · 4 months",
    title: "How did you transition out of the swaddle?",
    body: "Noah is starting to roll, so we need to stop swaddling. We tried one arm out last night and he woke every hour. What made the transition gentler for your family?",
    topic: "Sleep",
    createdAt: "2026-07-26T08:42:00",
    likes: 18,
    media: [],
    replies: [
      {
        id: "reply-sleep-1",
        author: "Priya K.",
        initials: "PK",
        babyAge: "Anya · 7 months",
        body: "We did one arm out for three nights, then moved to a sleep sack. The first two nights were rough, but keeping the bedtime routine exactly the same helped.",
        createdAt: "2026-07-26T09:18:00",
        media: [],
      },
      {
        id: "reply-sleep-2",
        author: "Marcus L.",
        initials: "ML",
        babyAge: "Theo · 6 months",
        body: "A slightly earlier bedtime helped us during the transition because he was less overtired. We also practised naps in the sleep sack first.",
        createdAt: "2026-07-26T10:04:00",
        media: [],
      },
    ],
  },
  {
    id: "forum-feeding",
    author: "Jamie R.",
    initials: "JR",
    babyAge: "Ellie · 5 months",
    title: "Suddenly refusing the evening bottle",
    body: "For the past three evenings Ellie takes a little, pulls away, then wants the bottle again. Daytime feeds are normal. Has anyone gone through a phase like this?",
    topic: "Feeding",
    createdAt: "2026-07-25T20:12:00",
    likes: 11,
    media: [],
    replies: [
      {
        id: "reply-feeding-1",
        author: "Amara D.",
        initials: "AD",
        babyAge: "Zuri · 8 months",
        body: "We had something similar when evenings became more distracting. A quieter room and a short pause before offering again worked for us.",
        createdAt: "2026-07-25T21:02:00",
        media: [],
      },
    ],
  },
  {
    id: "forum-skin",
    author: "Leah C.",
    initials: "LC",
    babyAge: "Owen · 3 months",
    title: "Keeping little cheeks comfortable in dry weather",
    body: "The air has been so dry and Owen’s cheeks look rough by the end of the day. I’m tracking it and will ask our doctor, but I’d love to hear what gentle routine other parents use.",
    topic: "Skin",
    createdAt: "2026-07-25T14:35:00",
    likes: 24,
    media: [],
    replies: [
      {
        id: "reply-skin-1",
        author: "Nora P.",
        initials: "NP",
        babyAge: "Maya · 9 months",
        body: "We keep baths short and pat dry instead of rubbing. Our clinician also helped us choose a simple fragrance-free moisturizer.",
        createdAt: "2026-07-25T15:11:00",
        media: [],
      },
      {
        id: "reply-skin-2",
        author: "Daniel S.",
        initials: "DS",
        babyAge: "Eli · 4 months",
        body: "A cool-mist humidifier made our nursery more comfortable. We clean it daily and still check with our pediatrician when the skin changes.",
        createdAt: "2026-07-25T16:28:00",
        media: [],
      },
    ],
  },
  {
    id: "forum-development",
    author: "Camila T.",
    initials: "CT",
    babyAge: "Leo · 4 months",
    title: "Tummy time ideas for a baby who protests",
    body: "Leo lasts about two minutes on the mat before getting upset. What playful variations helped your little one build up gradually?",
    topic: "Development",
    createdAt: "2026-07-24T11:20:00",
    likes: 31,
    media: [],
    replies: [
      {
        id: "reply-development-1",
        author: "Hannah B.",
        initials: "HB",
        babyAge: "Iris · 6 months",
        body: "Chest-to-chest tummy time counted for us! We also used a rolled towel and a mirror, just for very short happy sessions.",
        createdAt: "2026-07-24T12:03:00",
        media: [],
      },
    ],
  },
  {
    id: "forum-everyday",
    author: "Alex W.",
    initials: "AW",
    babyAge: "Sam · 7 months",
    title: "What do you pack for a first weekend trip?",
    body: "We’re taking our first two-night road trip and my packing list is becoming enormous. What did you actually use, and what could you have left at home?",
    topic: "Everyday",
    createdAt: "2026-07-23T18:47:00",
    likes: 15,
    media: [],
    replies: [],
  },
];

const fallbackData: AppData = { timeline: sampleTimeline, chats: sampleChats, forumPosts: sampleForumPosts };
const DB_NAME = "infant-symptom-support";
const STORE_NAME = "local-records";
const APP_KEY = "mila-profile";

function updateInfantName(value: string) {
  return value.replaceAll("MILA", "SOPHIE").replaceAll("Mila", "Sophie");
}

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
  const [timelineRange, setTimelineRange] = useState<"7" | "30" | "all">("7");
  const [selectedEntryId, setSelectedEntryId] = useState("sample-feeding");
  const [forumFilter, setForumFilter] = useState("All");
  const [forumSearch, setForumSearch] = useState("");
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [openPostId, setOpenPostId] = useState<string | null>("forum-sleep");
  const [chatInput, setChatInput] = useState("");
  const [chatImage, setChatImage] = useState<File | null>(null);
  const [chatBusy, setChatBusy] = useState(false);
  const [scriptStep, setScriptStep] = useState(0);
  const [toast, setToast] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    readStoredData()
      .then((stored) => {
        if (stored) {
          setData({
            ...stored,
            chats: stored.chats.map((message) => ({ ...message, text: updateInfantName(message.text) })),
            timeline: stored.timeline.map((entry) => ({
              ...entry,
              icon: (categoryMeta[entry.category] ?? categoryMeta.Other).icon,
              intensity: entry.intensity ?? (entry.id === "sample-rash" ? "moderate" : "mild"),
            })),
            forumPosts: (stored.forumPosts ?? sampleForumPosts).map((post) => ({
              ...post,
              babyAge: updateInfantName(post.babyAge),
              replies: post.replies.map((reply) => ({ ...reply, babyAge: updateInfantName(reply.babyAge) })),
            })),
          });
        }
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
  const selectedTimelineEntry =
    visibleTimeline.find((entry) => entry.id === selectedEntryId) ?? visibleTimeline[0];
  const visibleForumPosts = data.forumPosts.filter((post) => {
    const matchesTopic = forumFilter === "All" || post.topic === forumFilter;
    const query = forumSearch.trim().toLowerCase();
    const matchesSearch = !query || `${post.title} ${post.body} ${post.author} ${post.babyAge}`.toLowerCase().includes(query);
    return matchesTopic && matchesSearch;
  });

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
      intensity: String(form.get("intensity")) as TimelineEntry["intensity"],
      icon: meta.icon,
      tone: meta.tone,
      media,
    };
    setData((current) => ({ ...current, timeline: [entry, ...current.timeline] }));
    setSelectedEntryId(entry.id);
    setLogOpen(false);
    setToast("Symptom update saved to Sophie’s timeline.");
    event.currentTarget.reset();
  }

  function mediaFromForm(form: FormData): MediaItem[] {
    return form.getAll("media")
      .filter((item): item is File => item instanceof File && item.size > 0)
      .map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        mime: file.type,
        kind: file.type.startsWith("video/") ? "video" : "image",
        blob: file,
      }));
  }

  function handleNewPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const post: ForumPost = {
      id: crypto.randomUUID(),
      author: "You",
      initials: "YO",
      babyAge: "Sophie · 5 months",
      title: String(form.get("title")).trim(),
      body: String(form.get("body")).trim(),
      topic: String(form.get("topic")) as ForumPost["topic"],
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
      media: mediaFromForm(form),
    };
    setData((current) => ({ ...current, forumPosts: [post, ...current.forumPosts] }));
    setNewPostOpen(false);
    setOpenPostId(post.id);
    setForumFilter("All");
    setForumSearch("");
    setToast("Your community post is live on this device.");
    event.currentTarget.reset();
  }

  function handleReply(event: FormEvent<HTMLFormElement>, postId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reply: ForumReply = {
      id: crypto.randomUUID(),
      author: "You",
      initials: "YO",
      babyAge: "Sophie · 5 months",
      body: String(form.get("body")).trim(),
      createdAt: new Date().toISOString(),
      media: mediaFromForm(form),
    };
    setData((current) => ({
      ...current,
      forumPosts: current.forumPosts.map((post) =>
        post.id === postId ? { ...post, replies: [...post.replies, reply] } : post,
      ),
    }));
    setToast("Reply added to the conversation.");
    event.currentTarget.reset();
  }

  function likePost(postId: string) {
    setData((current) => ({
      ...current,
      forumPosts: current.forumPosts.map((post) =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post,
      ),
    }));
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
    doc.text("Prepared for Sophie · 5 months old", margin, 84);
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
    doc.save("sophie-symptom-summary.pdf");
    setToast("Doctor report downloaded.");
  }

  function resetSampleData() {
    setData({ timeline: sampleTimeline, chats: sampleChats, forumPosts: sampleForumPosts });
    setSettingsOpen(false);
    setToast("Sample profile restored.");
  }

  function deleteAllData() {
    if (!window.confirm("Delete every symptom log, chat, community post, image, and video stored on this device?")) return;
    setData({ timeline: [], chats: [], forumPosts: [] });
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
          <NavButton active={activeTab === "forum"} icon="◎" label="Community" onClick={() => goTo("forum")} />
          <NavButton active={activeTab === "report"} icon="□" label="Doctor report" onClick={() => goTo("report")} />
        </nav>
        <div className="privacy-note">
          <span className="privacy-icon">⌁</span>
          <div>
            <strong>Private by design</strong>
            <p>Your records stay on this device.</p>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <button className="mobile-brand" onClick={() => goTo("chat")} aria-label="Go to Assistant">
            <BrandMark /><span>CalmCradle</span>
          </button>
          <div className="top-actions">
            <button className="avatar-button" onClick={() => setSettingsOpen(true)} aria-label="Open settings">S</button>
          </div>
        </header>

        <div className="content">
          {activeTab === "timeline" && (
            <section className="page-panel">
              <div className="page-title-row">
                <div><p className="eyebrow">SYMPTOM HISTORY</p><h1>Sophie’s timeline</h1><p>See when symptoms appeared, how noticeable they felt, and what changed over time.</p></div>
                <button className="primary-button" onClick={() => setLogOpen(true)}><span>＋</span> Add an update</button>
              </div>
              <div className="timeline-toolbar">
                <div className="filter-row" aria-label="Filter timeline">
                  {["All", "Fever", "Rash or skin change", "Feeding concern", "Sleep or behavior change"].map((filter) => (
                    <button key={filter} className={timelineFilter === filter ? "active" : ""} onClick={() => { setTimelineFilter(filter); const next = filter === "All" ? data.timeline[0] : data.timeline.find((entry) => entry.category === filter); if (next) setSelectedEntryId(next.id); }}>{filter === "Rash or skin change" ? "Skin" : filter === "Feeding concern" ? "Feeding" : filter === "Sleep or behavior change" ? "Sleep" : filter}</button>
                  ))}
                </div>
                <div className="range-toggle" aria-label="Timeline date range">
                  <button className={timelineRange === "7" ? "active" : ""} onClick={() => { setTimelineRange("7"); if (visibleTimeline[0]) setSelectedEntryId(visibleTimeline[0].id); }}>7 days</button>
                  <button className={timelineRange === "30" ? "active" : ""} onClick={() => { setTimelineRange("30"); if (visibleTimeline[0]) setSelectedEntryId(visibleTimeline[0].id); }}>30 days</button>
                  <button className={timelineRange === "all" ? "active" : ""} onClick={() => { setTimelineRange("all"); if (visibleTimeline[0]) setSelectedEntryId(visibleTimeline[0].id); }}>All</button>
                </div>
              </div>
              {visibleTimeline.length ? (
                <>
                  <SymptomGraph entries={visibleTimeline} range={timelineRange} selectedId={selectedTimelineEntry?.id} onSelect={setSelectedEntryId} />
                  {selectedTimelineEntry && (
                    <div className="selected-update">
                      <div className="selected-update-heading"><div><p className="eyebrow">SELECTED UPDATE</p><h2>{formatEntryDate(selectedTimelineEntry.observedAt)}</h2></div><span>Click another marker to compare</span></div>
                      <TimelineCard entry={selectedTimelineEntry} expanded />
                    </div>
                  )}
                </>
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
                    <p className="eyebrow">SOPHIE · 5 MONTHS</p>
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
                    <textarea value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendChat(); } }} placeholder="Ask anything about Sophie…" rows={1} aria-label="Message" />
                    <button className="send-button" onClick={() => void sendChat()} disabled={!chatInput.trim() || chatBusy} aria-label="Send message">↑</button>
                  </div>
                  <p>Educational support only. This assistant cannot diagnose your infant.</p>
                </div>
              </div>
              <aside className="chat-context">
                <div className="mila-summary">
                  <span className="avatar">S</span>
                  <div><p className="eyebrow">TODAY</p><h2>Sophie’s context</h2><small>{data.timeline.length} updates available to the assistant</small></div>
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

          {activeTab === "forum" && (
            <section className="forum-page">
              <div className="page-title-row">
                <div>
                  <p className="eyebrow">PARENT COMMUNITY</p>
                  <h1>CalmCradle community</h1>
                  <p>A gentle place to swap practical ideas, small wins, and reassurance with other parents.</p>
                </div>
                <button className="primary-button" onClick={() => setNewPostOpen(true)}><span>＋</span> New post</button>
              </div>

              <div className="community-banner">
                <span>♡</span>
                <div><strong>Parents supporting parents</strong><p>Community experiences can be comforting, but they do not replace advice from your child’s healthcare professional.</p></div>
              </div>

              <div className="forum-toolbar">
                <label className="forum-search"><span>⌕</span><input value={forumSearch} onChange={(event) => setForumSearch(event.target.value)} placeholder="Search community posts" aria-label="Search community posts" /></label>
                <div className="forum-filters" aria-label="Filter community posts">
                  {["All", "Sleep", "Feeding", "Skin", "Development", "Everyday"].map((topic) => (
                    <button key={topic} className={forumFilter === topic ? "active" : ""} onClick={() => setForumFilter(topic)}>{topic}</button>
                  ))}
                </div>
              </div>

              <div className="forum-layout">
                <div className="forum-feed">
                  {visibleForumPosts.length ? visibleForumPosts.map((post) => {
                    const expanded = openPostId === post.id;
                    return (
                      <article className="forum-card" key={post.id}>
                        <div className="post-author">
                          <span className="forum-avatar">{post.initials}</span>
                          <div><strong>{post.author}</strong><small>{post.babyAge} · {formatEntryDate(post.createdAt)}</small></div>
                          <span className={`topic-pill topic-${post.topic.toLowerCase()}`}>{post.topic}</span>
                        </div>
                        <h2>{post.title}</h2>
                        <p className="post-body">{post.body}</p>
                        {post.media.length > 0 && <div className="media-grid">{post.media.map((item) => <MediaPreview item={item} key={item.id} />)}</div>}
                        <div className="post-footer">
                          <button className="post-action helpful-action" onClick={() => likePost(post.id)} aria-label={`Mark ${post.title} as helpful`}>
                            <span className="heart-icon" aria-hidden="true">♡</span>
                            <span>{post.likes} helpful</span>
                          </button>
                          <button className="post-action" onClick={() => setOpenPostId(expanded ? null : post.id)}>◌ <span>{post.replies.length} {post.replies.length === 1 ? "reply" : "replies"}</span></button>
                        </div>
                        {expanded && (
                          <div className="replies-panel">
                            {post.replies.map((reply) => (
                              <div className="forum-reply" key={reply.id}>
                                <span className="forum-avatar small">{reply.initials}</span>
                                <div className="reply-content">
                                  <div><strong>{reply.author}</strong><small>{reply.babyAge} · {formatEntryDate(reply.createdAt)}</small></div>
                                  <p>{reply.body}</p>
                                  {reply.media.length > 0 && <div className="media-grid compact-media">{reply.media.map((item) => <MediaPreview item={item} key={item.id} />)}</div>}
                                </div>
                              </div>
                            ))}
                            {!post.replies.length && <p className="first-reply">No replies yet. You can be the first to offer encouragement.</p>}
                            <form className="reply-form" onSubmit={(event) => handleReply(event, post.id)}>
                              <span className="forum-avatar small">YO</span>
                              <div>
                                <textarea name="body" required rows={2} placeholder="Add a kind, helpful reply…" aria-label={`Reply to ${post.title}`} />
                                <div className="reply-actions">
                                  <label className="reply-attach">＋ Photo or video<input name="media" type="file" accept="image/*,video/*" multiple onChange={validateFiles} /></label>
                                  <button className="primary-button" type="submit">Reply</button>
                                </div>
                              </div>
                            </form>
                          </div>
                        )}
                      </article>
                    );
                  }) : (
                    <div className="forum-empty"><span>⌕</span><h2>No posts found</h2><p>Try another topic or start a new conversation.</p><button className="primary-button" onClick={() => setNewPostOpen(true)}>Create a post</button></div>
                  )}
                </div>
                <aside className="forum-sidebar">
                  <div className="guidelines-card">
                    <p className="eyebrow">COMMUNITY CARE</p>
                    <h2>Kind, useful, and safe</h2>
                    <ul>
                      <li>Share your experience, not a diagnosis.</li>
                      <li>Keep infants’ personal details private.</li>
                      <li>Encourage professional care when needed.</li>
                    </ul>
                  </div>
                  <div className="topics-card">
                    <p className="eyebrow">POPULAR TOPICS</p>
                    {["Sleep", "Feeding", "Skin", "Development"].map((topic) => (
                      <button className="topic-row" key={topic} onClick={() => setForumFilter(topic)}><span>{topic}</span><b>{data.forumPosts.filter((post) => post.topic === topic).length}</b></button>
                    ))}
                  </div>
                </aside>
              </div>
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
                  <div className="report-top"><div><p className="eyebrow">INFANT SYMPTOM SUMMARY</p><h2>Sophie</h2><span>5 months old · Generated today</span></div><BrandMark /></div>
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
        <NavButton active={activeTab === "forum"} icon="◎" label="Community" onClick={() => goTo("forum")} />
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
              <label>What happened?<textarea name="note" required rows={4} placeholder="Describe what you noticed and how Sophie was acting…" /></label>
              <label>How noticeable was it?<select name="intensity" defaultValue="mild"><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="significant">Significant</option></select></label>
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
                <p className="eyebrow">DEMONSTRATION SAFETY CHECK</p><h2 id="urgency-title">Let’s check what Sophie needs</h2><p>Answer based on what you see right now. These prototype rules are not clinically validated.</p>
                <form onSubmit={evaluateUrgency}>
                  <label>What is the main concern?<select name="category">{symptomOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
                  <label>Temperature in °C, if measured<input name="temperature" type="number" step="0.1" placeholder="e.g. 37.4" /></label>
                  <YesNo name="breathing" label="Is Sophie struggling to breathe or are her lips blue?" />
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

      {newPostOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setNewPostOpen(false); }}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="new-post-title">
            <button className="close-button" onClick={() => setNewPostOpen(false)} aria-label="Close">×</button>
            <p className="eyebrow">NEW COMMUNITY POST</p><h2 id="new-post-title">Start a conversation</h2><p>Ask for ideas, share a small win, or connect with parents going through something similar.</p>
            <form onSubmit={handleNewPost}>
              <label>Topic<select name="topic" defaultValue="Everyday"><option>Sleep</option><option>Feeding</option><option>Skin</option><option>Development</option><option>Everyday</option></select></label>
              <label>Post title<input name="title" required placeholder="What would you like to talk about?" /></label>
              <label>Your post<textarea name="body" required rows={5} placeholder="Add a little context so other parents can help…" /></label>
              <label className="upload-zone"><span>＋</span><strong>Add photos or videos</strong><small>Images up to 10 MB · videos up to 50 MB</small><input name="media" type="file" accept="image/*,video/*" multiple onChange={validateFiles} /></label>
              <div className="modal-actions"><button type="button" className="text-button" onClick={() => setNewPostOpen(false)}>Cancel</button><button className="primary-button" type="submit">Publish post</button></div>
            </form>
          </section>
        </div>
      )}

      {settingsOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
          <section className="modal-card settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <button className="close-button" onClick={() => setSettingsOpen(false)} aria-label="Close">×</button>
            <div className="profile-large"><span className="avatar">S</span><div><p className="eyebrow">INFANT PROFILE</p><h2 id="settings-title">Sophie</h2><p>Born February 14, 2026 · 5 months old</p></div></div>
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

const symptomLanes = [
  { label: "Temperature", matches: (entry: TimelineEntry) => entry.category === "Fever" },
  { label: "Skin", matches: (entry: TimelineEntry) => entry.category === "Rash or skin change" },
  { label: "Feeding", matches: (entry: TimelineEntry) => ["Feeding concern", "Vomiting", "Diarrhea"].includes(entry.category) },
  { label: "Sleep & behavior", matches: (entry: TimelineEntry) => entry.category === "Sleep or behavior change" },
  { label: "Breathing", matches: (entry: TimelineEntry) => entry.category === "Cough or breathing" },
  { label: "Other", matches: (entry: TimelineEntry) => entry.category === "Other" },
];

function SymptomGraph({
  entries,
  range,
  selectedId,
  onSelect,
}: {
  entries: TimelineEntry[];
  range: "7" | "30" | "all";
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const earliest = entries.reduce((value, entry) => Math.min(value, new Date(entry.observedAt).getTime()), end.getTime());
  const start = new Date(range === "all" ? earliest : end.getTime());
  if (range === "all") {
    start.setHours(0, 0, 0, 0);
    if (end.getTime() - start.getTime() < 6 * 86400000) start.setTime(end.getTime() - 6 * 86400000);
  } else {
    start.setDate(end.getDate() - (Number(range) - 1));
    start.setHours(0, 0, 0, 0);
  }
  const span = Math.max(1, end.getTime() - start.getTime());
  const rangeEntries = entries.filter((entry) => {
    const time = new Date(entry.observedAt).getTime();
    return time >= start.getTime() && time <= end.getTime();
  });
  const lanes = symptomLanes.filter((lane) => rangeEntries.some(lane.matches));
  const labelCount = range === "7" ? 7 : 6;
  const dateLabels = Array.from({ length: labelCount }, (_, index) => {
    const date = new Date(start.getTime() + (span * index) / (labelCount - 1));
    return date.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  });

  return (
    <div className="symptom-graph">
      <div className="graph-heading">
        <div><p className="eyebrow">VISUAL OVERVIEW</p><h2>Patterns at a glance</h2></div>
        <div className="intensity-legend"><span><i className="mild"></i>Mild</span><span><i className="moderate"></i>Moderate</span><span><i className="significant"></i>Significant</span></div>
      </div>
      {rangeEntries.length ? (
        <div className="graph-scroll">
          <div className="graph-content">
            <div className="graph-dates"><span></span>{dateLabels.map((label, index) => <time key={`${label}-${index}`}>{label}</time>)}</div>
            {lanes.map((lane) => (
              <div className="graph-lane" key={lane.label}>
                <strong>{lane.label}</strong>
                <div className="graph-track">
                  {rangeEntries.filter(lane.matches).map((entry) => {
                    const left = ((new Date(entry.observedAt).getTime() - start.getTime()) / span) * 100;
                    return (
                      <button
                        key={entry.id}
                        className={`graph-marker ${entry.intensity} ${selectedId === entry.id ? "selected" : ""}`}
                        style={{ left: `${Math.max(1, Math.min(99, left))}%` }}
                        onClick={() => onSelect(entry.id)}
                        aria-label={`${entry.title}, ${entry.intensity}, ${formatEntryDate(entry.observedAt)}`}
                        title={`${entry.title} · ${entry.intensity}`}
                      >
                        <span>{entry.icon}</span>
                        {entry.media.length > 0 && <i aria-label="Has attachment">▧</i>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="graph-empty"><span>○</span><p>No updates fall within this date range.</p><button onClick={() => onSelect(entries[0].id)}>Show the most recent update below</button></div>
      )}
      <p className="graph-note">Marker size reflects how noticeable the caregiver recorded the change—not medical severity.</p>
    </div>
  );
}

function TimelineCard({ entry, expanded = false }: { entry: TimelineEntry; expanded?: boolean }) {
  return (
    <article className="timeline-card">
      <span className={`entry-icon ${entry.tone}`}>{entry.icon}</span>
      <div className="entry-body">
        <div className="entry-heading"><div><h3>{entry.title}</h3><div className="entry-tags"><span>{entry.category}</span><span className={`intensity-tag ${entry.intensity}`}>{entry.intensity}</span></div></div><time>{formatEntryDate(entry.observedAt)}</time></div>
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
      action: "Keep recording changes and check again if Sophie seems different.",
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
