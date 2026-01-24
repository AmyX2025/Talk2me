"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Segment, ConversationMessage } from "../types";
import { Mic, MicOff, Send, ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { generateFeedback } from "../lib/api";

// 声明 SpeechRecognition 类型
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function RolePlayPage() {
  const router = useRouter();
  const [segment, setSegment] = useState<Segment | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUserText, setCurrentUserText] = useState("");
  const [interimText, setInterimText] = useState(""); // 实时识别的临时文字
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState("nova"); // 默认使用 Nova

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // 提示音效 (Base64 encoded for portability)
  // Ding: Start listening
  const DING_SOUND = "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAFAAAAZgAAER0eHyAvMDIzODs9P0FFR0tMT1JUVVpcXmFiZGdnamxtb3FycncAAAB5AAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="; // Placeholder, I will use a real short chime
  // Pop: Send message
  const POP_SOUND = "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAFAAAAZgAAER0eHyAvMDIzODs9P0FFR0tMT1JUVVpcXmFiZGdnamxtb3FycncAAAB5AAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="; // Placeholder

  const playSound = (type: 'ding' | 'pop') => {
    const audio = new Audio(type === 'ding' ? "https://actions.google.com/sounds/v1/alarms/beep_short.ogg" : "https://actions.google.com/sounds/v1/cartoon/pop.ogg");
    audio.volume = 0.5;
    audio.play().catch(e => console.error("Sound play failed", e));
  };

  // OpenAI 声音列表
  const voices = [
    { id: "nova", name: "Nova (活力女声)", gender: "female" },
    { id: "alloy", name: "Alloy (中性女声)", gender: "female" },
    { id: "shimmer", name: "Shimmer (柔和女声)", gender: "female" },
    { id: "echo", name: "Echo (温暖男声)", gender: "male" },
    { id: "fable", name: "Fable (英式男声)", gender: "male" },
    { id: "onyx", name: "Onyx (深沉男声)", gender: "male" },
  ];

  // Text-to-Speech 函数
  const speakText = (text: string) => {
    if (!ttsEnabled || typeof window === "undefined") return;

    // 停止之前的语音
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85; // 稍慢一点，方便学习
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // 选择更自然的声音（按优先级）
    const voices = window.speechSynthesis.getVoices();
    console.log("可用声音:", voices.map(v => v.name).join(", "));

    // macOS 上优先选择 Samantha（最自然的美式女声）
    const preferredNames = ["Samantha", "Karen", "Moira", "Google US English Female", "Microsoft Zira"];

    let selectedVoice = null;
    for (const name of preferredNames) {
      selectedVoice = voices.find(v => v.name.includes(name));
      if (selectedVoice) break;
    }

    // 如果没找到优选，找任何英语女声
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("female"));
    }

    // 最后兜底：任何英语声音
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith("en"));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log("使用声音:", selectedVoice.name);
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // 初始化语音识别
  const initSpeechRecognition = () => {
    if (typeof window === "undefined") return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("浏览器不支持语音识别");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        // 检查是否包含结束指令 "over"
        const lowerTranscript = finalTranscript.toLowerCase();
        if (lowerTranscript.trim().endsWith("over") || lowerTranscript.trim().endsWith("over.")) {
          // 移除 "over" 及其后的标点
          const cleanTranscript = finalTranscript.replace(/over\.?$/i, "").trim();

          // 如果移除后还有内容，或者之前有累积内容，则发送
          if (cleanTranscript || currentUserText) {
            setCurrentUserText(prev => prev + " " + cleanTranscript);
            setInterimText("");
            // 延迟一点点确保状态更新
            setTimeout(() => stopListening(), 100);
            return; // 结束本次处理
          }
        }

        setCurrentUserText(prev => prev + " " + finalTranscript);
        setInterimText("");
      } else {
        setInterimText(interimTranscript);
      }


    };

    recognition.onerror = (event: any) => {
      console.error("语音识别错误:", event.error);
      if (event.error !== "no-speech") {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // 如果还在监听状态，自动重启（处理超时情况）
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          setIsListening(false);
        }
      }
    };

    return recognition;
  };

  // 开始语音识别
  const startListening = () => {
    // 停止 AI 说话
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    // 播放提示音
    playSound('ding');

    if (!recognitionRef.current) {
      recognitionRef.current = initSpeechRecognition();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setCurrentUserText("");
        setInterimText("");
      } catch (e) {
        console.error("启动语音识别失败:", e);
      }
    } else {
      alert("您的浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器");
    }
  };

  // 停止语音识别并发送
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);

    const textToSend = (currentUserText + " " + interimText).trim();
    setInterimText("");

    if (textToSend && ws && ws.readyState === WebSocket.OPEN) {
      playSound('pop'); // 发送提示音
      ws.send(JSON.stringify({
        type: "user_message",
        text: textToSend,
        voice: selectedVoice, // Fix: Include voice ID for voice input
      }));

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          text: textToSend,
          timestamp: Date.now(),
        },
      ]);

      setCurrentUserText("");
      setIsProcessing(true);
    }
  };

  useEffect(() => {
    // 预加载语音列表
    if (typeof window !== "undefined") {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    // 从localStorage获取片段数据
    const storedSegment = localStorage.getItem("selectedSegment");
    if (!storedSegment) {
      router.push("/practice");
      return;
    }

    setSegment(JSON.parse(storedSegment));

    // 初始化时显示加载状态
    setIsProcessing(true);
    setMessages([
      {
        role: "assistant",
        text: "Thinking about a topic...",
        timestamp: Date.now(),
      }
    ]);

    // 连接WebSocket
    const websocket = new WebSocket("ws://localhost:8000/ws/conversation");

    websocket.onopen = () => {
      console.log("WebSocket连接成功");
      const segmentData = JSON.parse(storedSegment);
      websocket.send(JSON.stringify({
        type: "init",
        segment_text: segmentData.sentences.map((s: any) => s.text).join(" "),
        voice: selectedVoice, // Fix: Pass the user's selected voice!
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "ai_message") {
        setMessages((prev) => {
          const filtered = prev.filter(
            (msg) => msg.text !== "正在识别..." && msg.text !== "Thinking about a topic..."
          );
          return [
            ...filtered,
            {
              role: "assistant",
              text: data.text,
              timestamp: Date.now(),
            },
          ];
        });
        setIsProcessing(false);

        // 🎤 AI 朗读回复
        if (data.audio_url) {
          const audio = new Audio("http://localhost:8000" + data.audio_url);
          audio.onplay = () => setIsSpeaking(true);
          audio.onended = () => {
            setIsSpeaking(false);
          };
          audio.play().catch(e => {
            console.error("播放音频失败:", e);
            speakText(data.text); // 失败降级到浏览器TTS
          });
        } else {
          speakText(data.text);
        }

        // 更新最后一条消息的 audio_url
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.role === "assistant" && lastMsg.text === data.text) {
            lastMsg.audio_url = data.audio_url;
          }
          return newMessages;
        });

      } else if (data.type === "error") {
        setMessages((prev) => {
          const filtered = prev.filter((msg) => msg.text !== "正在识别...");
          return filtered;
        });
        setIsProcessing(false);
        alert(data.message || "发生错误");
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket错误:", error);
    };

    websocket.onclose = () => {
      console.log("WebSocket连接关闭");
    };

    setWs(websocket);

    return () => {
      websocket.close();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendText = () => {
    if (!currentUserText.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({
      type: "user_message",
      text: currentUserText,
      voice: selectedVoice, // 发送声音偏好
    }));

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: currentUserText,
        timestamp: Date.now(),
      },
    ]);

    setCurrentUserText("");
    setIsProcessing(true);
  };

  const handleFinish = async () => {
    if (!segment) return;

    // 停止语音
    window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    try {
      const conversationId = `conv_${Date.now()}`;
      const segmentText = segment.sentences.map((s) => s.text).join(" ");

      const history = messages
        .filter(m => m.text !== "Thinking about a topic..." && m.text !== "正在识别...")
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      const feedback = await generateFeedback(conversationId, segmentText, history);

      localStorage.setItem("feedback", JSON.stringify(feedback));
      router.push("/feedback");
    } catch (error) {
      console.error("生成反馈失败:", error);
      alert("生成反馈失败，请稍后重试");
    }
  };

  if (!segment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 font-sans flex flex-col">
      <div className="container mx-auto px-4 max-w-4xl flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => router.push("/practice")}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all text-gray-900 font-bold text-sm"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="flex items-center gap-3">
            {/* Voice Selector */}
            <div className="relative">
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 bg-white border-2 border-gray-900 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {voices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-900">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
              </div>
            </div>

            {/* TTS Toggle */}
            <button
              onClick={() => {
                setTtsEnabled(!ttsEnabled);
                if (ttsEnabled) {
                  window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                }
              }}
              className={`p-2 border-2 border-gray-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all ${ttsEnabled ? "bg-[#C6F6D5] text-green-900" : "bg-gray-200 text-gray-500"
                }`}
              title={ttsEnabled ? "Mute Voice" : "Enable Voice"}
            >
              {ttsEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>

            {/* Finish Button */}
            <button
              onClick={handleFinish}
              className="px-5 py-2 bg-[#F6AD55] text-white border-2 border-gray-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all font-black tracking-wide text-sm"
            >
              FINISH
            </button>
          </div>
        </div>

        {/* Podcast Context (Collapsible/Small) */}
        <div className="bg-[#EDF5FD] rounded-2xl border-2 border-gray-900 p-4 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-sm font-black text-gray-900 mb-2 uppercase tracking-wider flex items-center gap-2">
            <span>📻</span> Context
          </h2>
          <div className="max-h-20 overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              {segment.sentences.map((s) => s.text).join(" ")}
            </p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-3xl border-2 border-gray-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col mb-6 relative">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-indigo-200">
                  <Mic size={40} className="text-indigo-300" />
                </div>
                <p className="text-xl font-bold text-gray-800">Start the conversation!</p>
                <p className="text-sm text-gray-500 mt-2">Tap the mic below and say hello.</p>
                <div className="mt-4 px-3 py-1 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800 font-medium">
                  Tip: Say <span className="font-bold">"Over"</span> to send.
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`px-6 py-4 rounded-2xl border-2 border-gray-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] relative text-sm md:text-base leading-relaxed font-medium ${msg.role === "user"
                      ? "bg-[#E9D8FD] text-gray-900 rounded-tr-sm"
                      : "bg-white text-gray-800 rounded-tl-sm"
                      }`}
                  >
                    {msg.text}
                  </div>

                  {/* Actions line */}
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-[10px] text-gray-400 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.role === "assistant" && ttsEnabled && msg.text !== "Thinking about a topic..." && (
                      <button
                        onClick={() => {
                          if (msg.audio_url) {
                            const audio = new Audio("http://localhost:8000" + msg.audio_url);
                            audio.onplay = () => setIsSpeaking(true);
                            audio.onended = () => setIsSpeaking(false);
                            audio.play();
                          } else {
                            speakText(msg.text);
                          }
                        }}
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Replay Audio"
                      >
                        <Volume2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl border-2 border-gray-900 p-4 rounded-tl-sm shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Status Indicators (Absolute positioned or Overlay) */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
            {isSpeaking && (
              <div className="flex items-center gap-2 px-4 py-1 bg-green-100 border-2 border-green-500 text-green-700 rounded-full shadow-lg animate-fade-in-down">
                <Volume2 size={16} className="animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">AI Speaking</span>
              </div>
            )}
          </div>

          {/* Interim Result Overlay (Bubbling up from user side) */}
          {(interimText || (isListening && currentUserText)) && (
            <div className="absolute bottom-6 right-6 max-w-[80%] pointer-events-none">
              <div className="bg-white/90 backdrop-blur border-2 border-indigo-400 text-indigo-900 px-4 py-3 rounded-2xl rounded-br-sm shadow-lg animate-pulse">
                <p className="text-sm font-medium">
                  {currentUserText} <span className="text-indigo-400">{interimText}</span>
                  <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-indigo-500 animate-blink"></span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Input Area (Floating Controller) */}
        <div className="bg-white rounded-2xl border-2 border-gray-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 flex gap-4 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              value={currentUserText}
              onChange={(e) => setCurrentUserText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendText()}
              placeholder="Type or speak..."
              className="w-full pl-4 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-colors text-gray-800 placeholder-gray-400"
              disabled={isProcessing || isListening}
            />
          </div>

          {/* Mic Button: Big and Heroic */}
          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-14 h-14 rounded-full border-2 border-gray-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all ${isListening
              ? "bg-red-500 text-white animate-pulse"
              : "bg-indigo-500 text-white hover:bg-indigo-600"
              }`}
            disabled={isProcessing}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {/* Send Button */}
          <button
            onClick={handleSendText}
            disabled={!currentUserText.trim() || isProcessing || isListening}
            className="w-14 h-14 rounded-xl border-2 border-gray-900 bg-[#C6F6D5] text-green-900 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none hover:bg-[#9AE6B4] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send size={22} />
          </button>
        </div>

      </div>
    </div>
  );
}
