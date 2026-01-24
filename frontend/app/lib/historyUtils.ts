// Episode History Utilities (localStorage-based)

export interface EpisodeRecord {
    id: string;
    title: string;
    audioUrl: string;
    practiceCount: number;
    lastPracticed: string;
    sentences: any[];
}

const HISTORY_KEY = "talk2me_episode_history";
const MAX_EPISODES = 10;

export function saveEpisode(podcast: any): void {
    const history = getRecentEpisodes();

    // Check if episode already exists
    const existingIndex = history.findIndex(ep => ep.title === podcast.title);

    if (existingIndex >= 0) {
        // Update existing
        history[existingIndex].practiceCount += 1;
        history[existingIndex].lastPracticed = new Date().toISOString();
    } else {
        // Add new
        const newRecord: EpisodeRecord = {
            id: `ep_${Date.now()}`,
            title: podcast.title,
            audioUrl: podcast.audio_url,
            practiceCount: 1,
            lastPracticed: new Date().toISOString(),
            sentences: podcast.sentences
        };
        history.unshift(newRecord);
    }

    // Keep only last N episodes
    const trimmed = history.slice(0, MAX_EPISODES);

    if (typeof window !== "undefined") {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    }
}

export function getRecentEpisodes(): EpisodeRecord[] {
    if (typeof window === "undefined") return [];

    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

export function clearHistory(): void {
    if (typeof window !== "undefined") {
        localStorage.removeItem(HISTORY_KEY);
    }
}
