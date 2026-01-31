"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRecentEpisodes, saveEpisode, EpisodeRecord } from "./lib/historyUtils";

export default function Home() {
  const router = useRouter();
  const [podcastUrl, setPodcastUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recentEpisodes, setRecentEpisodes] = useState<EpisodeRecord[]>([]);

  useEffect(() => {
    setRecentEpisodes(getRecentEpisodes());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/podcast/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: podcastUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "处理失败");
      }

      const data = await response.json();
      console.log("播客处理成功:", data);

      // 保存到localStorage和历史记录
      localStorage.setItem("currentPodcast", JSON.stringify(data));
      saveEpisode(data);

      // 跳转到跟读页面
      router.push("/practice");
    } catch (err: any) {
      setError(err.message || "发生错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 md:py-16 font-sans flex flex-col justify-center">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8 md:mb-12 transform hover:scale-105 transition-transform duration-500">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight" style={{ textShadow: "4px 4px 0px #CBD5E0" }}>
            Talk2Me
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-medium italic">
            Your friendly AI companion for podcast shadowing & chat.
          </p>
        </div>

        <div className="bg-white rounded-[2rem] p-6 md:p-8 border-2 border-gray-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 md:mb-10 relative overflow-hidden">
          {/* Decorative blobbies */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 left-0 w-32 h-32 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

          <h2 className="text-2xl font-bold mb-6 text-gray-900 relative z-10 flex items-center gap-2">
            <span>🎙️</span> Import Podcast
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div>
              <label
                htmlFor="podcast-url"
                className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide"
              >
                Podcast Link (Apple Podcasts)
              </label>
              <input
                id="podcast-url"
                type="url"
                value={podcastUrl}
                onChange={(e) => setPodcastUrl(e.target.value)}
                placeholder="Paste your link here..."
                className="w-full px-4 py-4 border-2 border-gray-900 rounded-xl focus:ring-0 focus:border-indigo-500 focus:shadow-[4px_4px_0px_0px_rgba(79,70,229,0.3)] transition-all bg-gray-50 text-lg placeholder-gray-400"
                required
                disabled={loading}
              />
              <p className="mt-2 text-xs text-gray-500 font-medium">
                Try an "All Ears English" episode for best results!
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 font-medium">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !podcastUrl}
              className="w-full bg-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <span>🚀</span> Start Practicing
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-[#EDF5FD] rounded-[2rem] border-2 border-gray-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8">
          <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
            <span>✨</span> How it works
          </h3>
          <ul className="space-y-4">
            {[
              "Import a podcast episode to get started.",
              "Shadow sentence-by-sentence with audio support.",
              "Chat with AI about the topic (Full Context Roleplay).",
              "Get a cute, personalized feedback report."
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-3 group">
                <div className="mt-1 w-6 h-6 rounded-full bg-indigo-100 border-2 border-gray-900 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                  {index + 1}
                </div>
                <span className="text-gray-700 font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Episodes */}
        {recentEpisodes.length > 0 && (
          <div className="mt-8 bg-white rounded-[2rem] border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
              <span>📚</span> Recent Episodes
            </h3>
            <div className="space-y-3">
              {recentEpisodes.slice(0, 5).map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => {
                    localStorage.setItem("currentPodcast", JSON.stringify({
                      title: ep.title,
                      audio_url: ep.audioUrl,
                      sentences: ep.sentences
                    }));
                    saveEpisode({ title: ep.title, audio_url: ep.audioUrl, sentences: ep.sentences });
                    router.push("/practice");
                  }}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all flex items-center justify-between group"
                >
                  <div>
                    <p className="font-medium text-gray-800 group-hover:text-indigo-600 truncate max-w-[300px]">{ep.title}</p>
                    <p className="text-xs text-gray-400 mt-1">Practiced {ep.practiceCount}x • {new Date(ep.lastPracticed).toLocaleDateString()}</p>
                  </div>
                  <span className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
