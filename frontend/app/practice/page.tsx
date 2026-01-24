"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AudioPlayer from "../components/AudioPlayer";
import SentenceList from "../components/SentenceList";
import CurrentSentence from "../components/CurrentSentence";
import { Podcast, Sentence, Segment } from "../types";
import { MessageSquare, ArrowLeft } from "lucide-react";

export default function PracticePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从URL参数或localStorage获取播客数据
    const podcastData = searchParams.get("data");
    if (podcastData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(podcastData));
        setPodcast(parsed);
        setLoading(false);
      } catch (e) {
        console.error("解析播客数据失败:", e);
        router.push("/");
      }
    } else {
      // 尝试从localStorage获取
      const stored = localStorage.getItem("currentPodcast");
      if (stored) {
        setPodcast(JSON.parse(stored));
        setLoading(false);
      } else {
        router.push("/");
      }
    }
  }, [searchParams, router]);

  const handleSentenceClick = (index: number) => {
    setCurrentSentenceIndex(index);
  };

  const handleStartRolePlay = () => {
    if (!podcast) return;

    // 创建包含所有句子的完整片段
    const fullSegment: Segment = {
      start: 0,
      end: podcast.sentences[podcast.sentences.length - 1].end,
      // Ideally backend uses sentences for context. 
      // For compatibility, we verify what `Segment` type expects.
      sentences: podcast.sentences
    };

    // 保存数据到localStorage并跳转
    localStorage.setItem("selectedSegment", JSON.stringify(fullSegment));
    localStorage.setItem("currentPodcast", JSON.stringify(podcast));
    router.push("/roleplay");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!podcast) {
    return null;
  }

  const currentSentence =
    currentSentenceIndex >= 0
      ? podcast.sentences[currentSentenceIndex]
      : null;

  return (
    <div className="min-h-screen bg-[#E0F7FA] py-8 font-sans">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="p-2 bg-white border-2 border-gray-900 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <div className="text-right">
            <h1 className="text-xl font-patrick font-bold text-gray-900 truncate max-w-[300px]">
              {podcast.title}
            </h1>
          </div>
        </div>

        <div className="space-y-6">

          {/* Top Section: Player & Focus */}
          <div className="bg-white rounded-xl border-2 border-gray-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="bg-[#E0F2F1] p-4 border-b-2 border-gray-900 flex justify-between items-center">
              <span className="font-patrick font-bold text-xl text-teal-900">🎧 Player</span>
              <AudioPlayer
                audioUrl={`http://localhost:8000${podcast.audio_url}`}
                sentences={podcast.sentences}
                currentSentenceIndex={currentSentenceIndex}
                onSentenceChange={setCurrentSentenceIndex}
              />
            </div>

            <div className="p-8 min-h-[160px] flex items-center justify-center text-center bg-white relative">
              {currentSentence ? (
                <div className="w-full">
                  <CurrentSentence
                    sentence={currentSentence}
                    prevSentence={currentSentenceIndex > 0 ? podcast.sentences[currentSentenceIndex - 1] : null}
                    nextSentence={currentSentenceIndex < podcast.sentences.length - 1 ? podcast.sentences[currentSentenceIndex + 1] : null}
                  />
                </div>
              ) : (
                <div className="opacity-40">
                  <h3 className="font-patrick text-2xl text-gray-800">Tap below to shadow</h3>
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end">
            <button
              onClick={handleStartRolePlay}
              className="bg-[#C8E6C9] text-gray-900 px-6 py-2 rounded-lg font-patrick font-bold text-xl border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2"
            >
              <MessageSquare size={20} />
              I'm ready to Chat 💬
            </button>
          </div>

          {/* Notebook List */}
          <div className="bg-white rounded-xl border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative">
            {/* Spiral Binding Visuals (Optional - simplified to header) */}
            <div className="bg-indigo-500 p-3 border-b-2 border-gray-900 flex items-center gap-2 text-white">
              <span className="font-patrick font-bold text-xl ml-2">📓 Transcript</span>
            </div>
            <div className="p-0">
              <SentenceList
                sentences={podcast.sentences}
                currentIndex={currentSentenceIndex}
                onSentenceClick={handleSentenceClick}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins > 0) {
    return `${mins}分${secs}秒`;
  }
  return `${secs}秒`;
}
