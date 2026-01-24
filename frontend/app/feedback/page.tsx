"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";

export default function FeedbackPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("feedback");
    if (stored) {
      setFeedback(JSON.parse(stored));
      setLoading(false);
    } else {
      router.push("/practice");
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium">✨ Generating your insights...</p>
        </div>
      </div>
    );
  }

  if (!feedback) return null;

  // Handle fallback for legacy string feedback
  const content = feedback.feedback_content || {
    overall_score: 8,
    encouragement: "Great job practicing! Keep it up.",
    vocabulary_highlights: [],
    grammar_tips: [],
    specific_improvements: []
  };

  // Liz Fossilien Style Colors
  // Background: Creamy off-white (#FDFBF7)
  // Cards: Pastel Blue (#EDF5FD), Pastel Lilac (#F3EFFF), Pastel Mint (#EAFBF5)
  // Text: Charcoal (#2D3748)

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 font-sans flex flex-col items-center justify-center">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header Navigation */}
        <div className="mb-10 flex items-center justify-between">
          <button
            onClick={() => router.push("/practice")}
            className="group flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <div className="p-2 rounded-full bg-white border border-gray-200 group-hover:border-gray-400 transition-all">
              <ArrowLeft size={18} />
            </div>
            <span className="font-medium">Back</span>
          </button>

          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-gray-800 hover:-translate-y-0.5 transition-all text-sm font-medium tracking-wide"
          >
            <Home size={18} />
            Home
          </button>
        </div>

        {/* Single Takeaways Card */}
        <div className="bg-white rounded-3xl p-8 border-2 border-gray-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-center mb-8">
            <div className="inline-block px-4 py-1 bg-yellow-100 border-2 border-yellow-400 rounded-full text-sm font-bold text-yellow-800 mb-4">
              🎯 Today's Takeaways
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">
              3-5 Things to Remember
            </h1>
            <p className="text-gray-500 text-sm">Read each one aloud 3 times 🔊</p>
          </div>

          <div className="space-y-4">
            {content.takeaways?.map((item: string, i: number) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 hover:shadow-md transition-shadow"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <p className="text-gray-800 text-lg font-medium leading-relaxed pt-1">{item}</p>
              </div>
            ))}

            {(!content.takeaways || content.takeaways.length === 0) && (
              <div className="text-center py-8 text-gray-400">
                <p>No takeaways generated. Try having a longer conversation!</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-dashed border-gray-200 text-center">
            <button
              onClick={() => router.push("/practice")}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              Practice Again 🔄
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Talk2Me • Keep it simple</p>
        </div>
      </div>
    </div>
  );
}
