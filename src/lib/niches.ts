export interface Niche {
  id: string;
  label: string;
  icon: string; // lucide-react icon component name
  youtubeKeywords: string[];
  ttsVoice: string; // msedge-tts voice name
}

export const NICHES: Niche[] = [
  {
    id: "education",
    label: "Education",
    icon: "GraduationCap",
    youtubeKeywords: ["study tips", "explained simply", "how it works"],
    ttsVoice: "en-US-GuyNeural",
  },
  {
    id: "health",
    label: "Health & Wellness",
    icon: "HeartPulse",
    youtubeKeywords: ["health tips", "nutrition facts", "mental health"],
    ttsVoice: "en-US-JennyNeural",
  },
  {
    id: "finance",
    label: "Finance & Business",
    icon: "TrendingUp",
    youtubeKeywords: ["personal finance", "investing tips", "startup advice"],
    ttsVoice: "en-US-EricNeural",
  },
  {
    id: "technology",
    label: "Technology",
    icon: "Cpu",
    youtubeKeywords: ["tech review", "AI news", "coding tips"],
    ttsVoice: "en-US-GuyNeural",
  },
  {
    id: "gaming",
    label: "Gaming",
    icon: "Gamepad2",
    youtubeKeywords: ["game news", "gameplay tips", "game review"],
    ttsVoice: "en-US-GuyNeural",
  },
  {
    id: "beauty",
    label: "Beauty & Fashion",
    icon: "Sparkles",
    youtubeKeywords: ["makeup tutorial", "fashion trends", "skincare tips"],
    ttsVoice: "en-US-JennyNeural",
  },
  {
    id: "food",
    label: "Food & Cooking",
    icon: "UtensilsCrossed",
    youtubeKeywords: ["easy recipe", "cooking tips", "food review"],
    ttsVoice: "en-US-JennyNeural",
  },
  {
    id: "travel",
    label: "Travel",
    icon: "Plane",
    youtubeKeywords: ["travel guide", "travel tips", "destination guide"],
    ttsVoice: "en-US-EricNeural",
  },
];

export function getNicheById(id: string): Niche | undefined {
  return NICHES.find((niche) => niche.id === id);
}
