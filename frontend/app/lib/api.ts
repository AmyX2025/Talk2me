const API_BASE_URL = "http://localhost:8000";

export async function processPodcast(url: string) {
  const response = await fetch(`${API_BASE_URL}/api/podcast/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "处理失败");
  }

  return response.json();
}

export async function generateFeedback(conversationId: string, segmentText: string, conversationHistory: any[] = []) {
  const response = await fetch(`${API_BASE_URL}/api/feedback/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      segment_text: segmentText,
      conversation_history: conversationHistory
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "生成反馈失败");
  }

  return response.json();
}
