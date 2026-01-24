"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, ChevronRight, BookOpen } from "lucide-react";
import { Sentence } from "../types";

interface AudioPlayerProps {
  audioUrl: string;
  sentences: Sentence[];
  currentSentenceIndex: number;
  onSentenceChange: (index: number) => void;
}

export default function AudioPlayer({
  audioUrl,
  sentences,
  currentSentenceIndex,
  onSentenceChange,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shadowingMode, setShadowingMode] = useState(false); // 跟读模式
  const [subtitleOffset, setSubtitleOffset] = useState(0); // 字幕偏移量（秒）

  // 跟读模式的关键状态：记录"这一轮播放要在哪句话结束后暂停"
  const [targetPauseSentence, setTargetPauseSentence] = useState(-1);

  // 使用ref来跟踪状态，避免闭包问题
  const isPlayingRef = useRef(isPlaying);
  const shadowingModeRef = useRef(shadowingMode);
  const targetPauseSentenceRef = useRef(targetPauseSentence);
  const subtitleOffsetRef = useRef(subtitleOffset);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    shadowingModeRef.current = shadowingMode;
  }, [shadowingMode]);

  useEffect(() => {
    targetPauseSentenceRef.current = targetPauseSentence;
    console.log(`目标暂停句子更新: ${targetPauseSentence}`);
  }, [targetPauseSentence]);

  useEffect(() => {
    subtitleOffsetRef.current = subtitleOffset;
  }, [subtitleOffset]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setTargetPauseSentence(-1);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    // 检查当前播放时间对应的句子
    const checkSentence = () => {
      const current = audio.currentTime;

      // 找到当前时间对应的句子
      // 使用 < s.end 防止边界重叠问题（当上一句结束时间等于下一句开始时间时）
      const index = sentences.findIndex(
        (s) => current >= s.start && current < s.end
      );

      // 跟读模式：检测目标句子是否播放完成
      if (shadowingModeRef.current && isPlayingRef.current && targetPauseSentenceRef.current >= 0) {
        const targetIndex = targetPauseSentenceRef.current;

        if (targetIndex < sentences.length) {
          const targetSentence = sentences[targetIndex];
          const bufferTime = 0.3; // 缓冲时间

          // 当播放时间超过目标句子的结束时间，自动暂停
          if (current >= targetSentence.end + bufferTime) {
            console.log(`跟读模式：句子 ${targetIndex} (${targetSentence.start.toFixed(2)}-${targetSentence.end.toFixed(2)}) 播放完成，当前时间 ${current.toFixed(2)}，自动暂停并回弹`);

            audio.pause();
            setIsPlaying(false);

            // 关键修复：自动回弹到这句话的开始位置
            // 这样用户看到的字幕和进度条都停留在刚刚听完的这句话上
            // 额外前移 0.5秒，防止开头被吞
            const rewindTime = Math.max(0, targetSentence.start - 0.5);
            audio.currentTime = rewindTime;
            setCurrentTime(rewindTime);

            // 强制更新UI高亮到这句话
            onSentenceChange(targetIndex);

            setTargetPauseSentence(-1); // 清除目标
            return;
          }
        }
      }

      // 更新当前句子索引（用于UI高亮）
      // 关键修复：只有在播放状态下才自动更新高亮
      // 防止自动暂停并回弹时，由于回弹到了上一句的时间范围，导致高亮跳回上一句
      if (isPlayingRef.current && index !== -1 && index !== currentSentenceIndex) {
        // 高亮锁定逻辑：
        // 如果在跟读模式下，且有目标暂停句子，且新检测到的句子是目标句子的下一句
        // 或者是目标句子本身（防止跳回）
        // 此时不要更新高亮，保持在目标句子上，直到暂停完成
        if (shadowingModeRef.current && targetPauseSentenceRef.current >= 0) {
          const target = targetPauseSentenceRef.current;
          // 如果新句子是下一句（说明缓冲区溢出），或者是目标句子本身，保持不变
          // 只有当偏差太大（超过一句）才强制更新
          if (index === target + 1 || index === target) {
            return;
          }
        }

        onSentenceChange(index);
      }
    };

    const interval = setInterval(checkSentence, 100);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      clearInterval(interval);
    };
  }, [sentences, currentSentenceIndex, onSentenceChange]);

  // 开始播放（设置目标暂停句子）
  const startPlayingFromSentence = (sentenceIndex: number) => {
    const audio = audioRef.current;
    if (!audio || sentenceIndex < 0 || sentenceIndex >= sentences.length) return;

    const sentence = sentences[sentenceIndex];
    audio.currentTime = sentence.start;
    audio.play();
    setIsPlaying(true);

    // 在跟读模式下，设置目标暂停句子
    if (shadowingMode) {
      setTargetPauseSentence(sentenceIndex);
      console.log(`开始播放句子 ${sentenceIndex}，设置目标暂停`);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setTargetPauseSentence(-1);
    } else {
      // 开始播放时，找到当前时间对应的句子
      const current = audio.currentTime;
      let targetIndex = sentences.findIndex(
        (s) => current >= s.start && current <= s.end
      );

      // 如果找不到，使用当前显示的句子索引
      if (targetIndex === -1) {
        targetIndex = currentSentenceIndex >= 0 ? currentSentenceIndex : 0;
      }

      audio.play();
      setIsPlaying(true);

      // 在跟读模式下，设置目标暂停句子
      if (shadowingMode && targetIndex >= 0) {
        setTargetPauseSentence(targetIndex);
        console.log(`播放，设置目标暂停句子: ${targetIndex}`);
      }
    }
  };

  const replayCurrent = () => {
    if (currentSentenceIndex === -1) return;
    startPlayingFromSentence(currentSentenceIndex);
  };

  const playNextSentence = () => {
    if (currentSentenceIndex === -1) return;
    const nextIndex = currentSentenceIndex + 1;
    if (nextIndex < sentences.length) {
      onSentenceChange(nextIndex);
      startPlayingFromSentence(nextIndex);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };



  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);

    // 拖动进度条后，更新当前句子索引
    const index = sentences.findIndex(
      (s) => newTime >= s.start && newTime < s.end
    );
    if (index !== -1 && index !== currentSentenceIndex) {
      onSentenceChange(index);
    }

    // 清除目标暂停句子（用户手动拖动了进度条）
    setTargetPauseSentence(-1);
  };

  return (
    <div className="w-full">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Controls: Play/Pause */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <button
            onClick={replayCurrent}
            disabled={currentSentenceIndex === -1}
            className="w-12 h-12 bg-gray-100 border-2 border-gray-900 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
            title="Replay Sentence"
          >
            <RotateCcw size={20} className="text-gray-900" />
          </button>
          <button
            onClick={togglePlay}
            className="w-16 h-16 bg-indigo-500 border-2 border-gray-900 rounded-full flex items-center justify-center text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none hover:bg-indigo-600 transition-all active:translate-y-[2px] active:shadow-none"
          >
            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </button>
          {shadowingMode && (
            <button
              onClick={playNextSentence}
              disabled={currentSentenceIndex === -1 || currentSentenceIndex >= sentences.length - 1}
              className="w-12 h-12 bg-indigo-100 border-2 border-gray-900 rounded-full flex items-center justify-center hover:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
              title="Next Sentence"
            >
              <ChevronRight size={24} className="text-indigo-700" />
            </button>
          )}
        </div>

        {/* Progress Bar (Expands to fill) */}
        <div className="flex-1 w-full relative group">
          <div className="flex justify-between text-xs font-bold font-mono text-gray-500 mb-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-4 bg-gray-200 rounded-full appearance-none cursor-pointer border-2 border-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 accent-indigo-600"
          />
        </div>

        {/* Settings: Shadowing Mode (Right side) */}
        <div className="flex-shrink-0">
          <label className={`flex items-center gap-3 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all ${shadowingMode
            ? "bg-indigo-100 border-indigo-500 shadow-inner"
            : "bg-white border-gray-300 hover:border-gray-900"
            }`}>
            <input
              type="checkbox"
              checked={shadowingMode}
              onChange={(e) => {
                setShadowingMode(e.target.checked);
                setTargetPauseSentence(-1);
              }}
              className="hidden"
            />
            <div className={`w-5 h-5 rounded border-2 border-gray-900 flex items-center justify-center ${shadowingMode ? "bg-indigo-500" : "bg-white"}`}>
              {shadowingMode && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-gray-900">Shadow Mode</span>
              <span className="text-[10px] text-gray-500 font-medium leading-none">Auto-pause</span>
            </div>
          </label>
        </div>
      </div>

      {shadowingMode && currentSentenceIndex >= 0 && (
        <div className="mt-4 text-center">
          <span className="inline-block px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-full text-xs font-bold text-yellow-800 animate-pulse">
            {isPlaying ? `Playing Sentence #${currentSentenceIndex + 1}` : "Ready to practice"}
          </span>
        </div>
      )}
    </div>
  );
}
