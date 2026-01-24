"use client";

import { useState, useEffect, useRef } from "react";
import { Sentence, Segment } from "../types";
import { Check } from "lucide-react";

interface SegmentSelectorProps {
  sentences: Sentence[];
  onSelect: (segment: Segment) => void;
  currentIndex?: number; // 当前播放的句子索引
}

export default function SegmentSelector({
  sentences,
  onSelect,
  currentIndex = -1,
}: SegmentSelectorProps) {
  const [startIndex, setStartIndex] = useState<number | null>(null);
  const [endIndex, setEndIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentenceRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 自动滚动到当前播放的句子（只在容器内滚动，不影响整个页面）
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

  const handleSentenceClick = (index: number) => {
    if (startIndex === null) {
      setStartIndex(index);
      setEndIndex(index);
    } else if (endIndex === null || index < startIndex) {
      setStartIndex(index);
      setEndIndex(index);
    } else {
      setEndIndex(index);
    }
  };

  const handleConfirm = () => {
    if (startIndex !== null && endIndex !== null) {
      const selectedSentences = sentences.slice(startIndex, endIndex + 1);
      const segment: Segment = {
        start: sentences[startIndex].start,
        end: sentences[endIndex].end,
        sentences: selectedSentences,
      };
      onSelect(segment);
    }
  };

  const handleClear = () => {
    setStartIndex(null);
    setEndIndex(null);
  };

  const isSelected = (index: number) => {
    if (startIndex === null || endIndex === null) return false;
    return index >= startIndex && index <= endIndex;
  };

  const duration =
    startIndex !== null && endIndex !== null
      ? sentences[endIndex].end - sentences[startIndex].start
      : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        选择感兴趣的片段（2-3分钟）
      </h3>

      <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">已选择片段：</span>
          <span className="text-sm font-semibold text-indigo-600">
            {duration > 0 ? formatDuration(duration) : "未选择"}
          </span>
        </div>
        {startIndex !== null && endIndex !== null && (
          <div className="mt-2">
            <p className="text-sm font-mono text-indigo-700 bg-white px-3 py-1.5 rounded border border-indigo-200">
              {formatTime(sentences[startIndex].start)} - {formatTime(sentences[endIndex].end)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              共 {endIndex - startIndex + 1} 个句子
            </p>
          </div>
        )}
      </div>

      <div 
        ref={containerRef}
        className="max-h-96 overflow-y-auto mb-4 space-y-2"
      >
        {sentences.map((sentence, index) => {
          const isCurrent = index === currentIndex;
          
          return (
            <div
              key={index}
              ref={(el) => {
                sentenceRefs.current[index] = el;
              }}
              onClick={() => handleSentenceClick(index)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                isSelected(index)
                  ? "bg-indigo-100 border-2 border-indigo-500"
                  : isCurrent
                  ? "bg-blue-50 border-2 border-blue-300"
                  : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {formatTime(sentence.start)} - {formatTime(sentence.end)}
                    </span>
                    {isCurrent && (
                      <span className="text-xs text-blue-600 font-medium animate-pulse">
                        🔊 播放中
                      </span>
                    )}
                    {isSelected(index) && (
                      <Check size={14} className="text-indigo-600" />
                    )}
                  </div>
                  <span className="text-gray-800 text-sm leading-relaxed">
                    {sentence.text}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={startIndex === null || endIndex === null}
          className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          确认选择
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          清除
        </button>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// 格式化时长（用于显示总时长）
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins > 0) {
    return `${mins}分${secs}秒`;
  }
  return `${secs}秒`;
}
