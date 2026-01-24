export interface Sentence {
  text: string;
  start: number;
  end: number;
}

export interface Podcast {
  title: string;
  audio_url: string;
  sentences: Sentence[];
  duration: number;
}

export interface Segment {
  start: number;
  end: number;
  sentences: Sentence[];
}

export interface ConversationMessage {
  role: "user" | "assistant";
  text: string;
  audio_url?: string;
  timestamp: number;
}

export interface Feedback {
  conversation_id: string;
  feedback_text: string;
  created_at: string;
}
