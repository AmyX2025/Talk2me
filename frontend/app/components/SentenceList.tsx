"use client";

import { useEffect, useRef } from "react";
import { Sentence } from "../types";

interface SentenceListProps {
  sentences: Sentence[];
  currentIndex: number;
  onSentenceClick: (index: number) => void;
  selectedRange?: { start: number; end: number };
}

export default function SentenceList({
  sentences,
  currentIndex,
  onSentenceClick,
  selectedRange,
}: SentenceListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentenceRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 自动滚动到当前句子（只在容器内滚动，不影响整个页面）
  useEffect(() => {
    if (currentIndex >= 0 && containerRef.current && sentenceRefs.current[currentIndex]) {
      const currentElement = sentenceRefs.current[currentIndex];
      const container = containerRef.current;

      if (currentElement) {
        // 计算元素相对于容器的位置
        const containerTop = container.scrollTop;
        const elementTop = currentElement.offsetTop;
        const elementHeight = currentElement.offsetHeight;
        const containerHeight = container.clientHeight;

        // 计算元素在容器中的位置
        const elementRelativeTop = elementTop - containerTop;
        const elementRelativeBottom = elementRelativeTop + elementHeight;

        // 检查元素是否在可视区域内
        const isVisible =
          elementRelativeTop >= 0 &&
          elementRelativeBottom <= containerHeight;

        // 如果不在可视区域内，滚动容器（不影响整个页面）
        if (!isVisible) {
          // 计算目标滚动位置，使元素居中
          const targetScrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);

          container.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth',
          });
        }
      }
    }
  }, [currentIndex]);

  const isInRange = (sentence: Sentence) => {
    if (!selectedRange) return true;
    return (
      sentence.start >= selectedRange.start &&
      sentence.end <= selectedRange.end
    );
  };

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-lg shadow-sm p-0 max-h-96 overflow-y-auto"
    >
      <div className="flex flex-col">
        {sentences.map((sentence, index) => {
          const isCurrent = index === currentIndex;
          const inRange = isInRange(sentence);

          return (
            <div
              key={index}
              ref={(el) => {
                sentenceRefs.current[index] = el;
              }}
              onClick={() => onSentenceClick(index)}
              className={`p-4 cursor-pointer transition-colors border-b border-blue-100 border-dashed ${isCurrent
                  ? "bg-[#FFF9C4]" // Highlighter yellow
                  : isCurrent === false && inRange === false // Standard
                    ? "hover:bg-blue-50"
                    : ""
                }`}
            >
              <div className="flex items-start justify-between gap-4">
                <p className={`text-xl font-patrick leading-relaxed ${isCurrent ? "text-gray-900" : "text-gray-600"}`}>
                  {sentence.text}
                </p>
                <span className="text-xs font-mono text-gray-400 whitespace-nowrap mt-1">
                  {formatTime(sentence.start)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
