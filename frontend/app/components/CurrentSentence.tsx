"use client";

import { Sentence } from "../types";

interface CurrentSentenceProps {
  sentence: Sentence | null;
  prevSentence?: Sentence | null;
  nextSentence?: Sentence | null;
}

export default function CurrentSentence({ sentence, prevSentence, nextSentence }: CurrentSentenceProps) {
  if (!sentence) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-500">选择或播放句子开始练习</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-center flex flex-col gap-4">
      {/* 上一句 */}
      <div className="min-h-[1.5em] transition-opacity duration-300">
        {prevSentence ? (
          <p className="text-indigo-200/60 text-sm truncate">{prevSentence.text}</p>
        ) : (
          <div className="h-5"></div>
        )}
      </div>

      {/* 当前句 */}
      <div>
        <p className="text-white text-xl leading-relaxed font-medium">{sentence.text}</p>
        <p className="text-indigo-100 text-sm mt-2 opacity-80">
          {formatTime(sentence.start)} - {formatTime(sentence.end)}
        </p>
      </div>

      {/* 下一句 */}
      <div className="min-h-[1.5em] transition-opacity duration-300">
        {nextSentence ? (
          <p className="text-indigo-200/60 text-sm truncate">{nextSentence.text}</p>
        ) : (
          <div className="h-5"></div>
        )}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
