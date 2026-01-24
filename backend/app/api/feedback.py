"""
反馈相关API
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.groq_service import GroqService
from datetime import datetime

router = APIRouter()
groq_service = GroqService()

class FeedbackRequest(BaseModel):
    conversation_id: str
    segment_text: str
    conversation_history: List[Dict[str, str]] = []

from typing import List, Dict
import json

class FeedbackContent(BaseModel):
    takeaways: List[str]  # 3-5 concise sentences to remember

class FeedbackResponse(BaseModel):
    conversation_id: str
    feedback_content: FeedbackContent
    created_at: str

@router.post("/generate", response_model=FeedbackResponse)
async def generate_feedback(request: FeedbackRequest):
    """
    生成学习反馈 - 精简版：3-5条值得复述的Takeaways
    """
    try:
        history_text = "\n".join([f"{msg['role'].upper()}: {msg['text']}" for msg in request.conversation_history])
        
        # 1. Generate Podcast Takeaways (Source material)
        # We increase the context window to skip potential intros
        podcast_prompt = f"""Task: Extract 3 distinct, high-value, NATIVE English sentences from the text below.
        
        CRITICAL FILTERS (Do NOT extract these):
        - NO Ads, App promotions, or "Subscribe" messages.
        - NO Host introductions ("I'm Lindsay", "This is All Ears English").
        - NO Generic show mottos ("Connection not perfection").
        
        TARGET CONTENT:
        - Phrasal verbs in context.
        - Idiomatic expressions used in the discussion.
        - Opinions or specific topic details.
        
        Text (Scan for the actual conversation):
        {request.segment_text[:2500]} 
        
        Output JSON: {{ "podcast_takeaways": ["Sentence 1", "Sentence 2", "Sentence 3"] }}"""
        
        podcast_response = groq_service.generate_response(
            user_message=podcast_prompt,
            system_prompt="You are a linguistic filter. Extract only conversational substance. Output valid JSON.",
            conversation_history=[]
        )
        
        # 2. Generate Conversation Corrections (User performance)
        # Only if there is meaningful history
        user_takeaways = []
        if len(request.conversation_history) > 2:
            conv_prompt = f"""Task: Identify 3 user errors or unnatural phrasings from the conversation.
            Rules:
            1. REPHRASE the user's intent into perfect Native English.
            2. Format: "Native Sentence. (Better than: 'User's error')"
            3. If user was perfect, provide an advanced idiom related to the topic.
            4. NO ADVICE. JUST THE SENTENCES.

            Conversation:
            {history_text}
            
            Output JSON: {{ "user_takeaways": ["Correction 1", "Correction 2", "Correction 3"] }}"""
             
            conv_response = groq_service.generate_response(
                user_message=conv_prompt,
                system_prompt="You are a harsh but helpful native speaker coach. Output valid JSON only.",
                conversation_history=[]
            )
            try:
                user_data = json.loads(conv_response.replace("```json", "").replace("```", "").strip())
                user_takeaways = user_data.get("user_takeaways", [])
            except:
                pass

        # 3. Parse and Combine
        try:
            pod_data = json.loads(podcast_response.replace("```json", "").replace("```", "").strip())
            pod_takeaways = pod_data.get("podcast_takeaways", [])
        except:
            pod_takeaways = []

        # Final List Construction
        final_takeaways = []
        
        # Add Podcast gems (marked)
        for t in pod_takeaways[:3]:
            final_takeaways.append(f"🎧 {t}")
            
        # Add User corrections (marked)
        # If no user takeaways (short conv), fallback to more podcast ones or generic encouraging *phrases* (not advice)
        if user_takeaways:
            for t in user_takeaways[:3]:
                final_takeaways.append(f"🗣️ {t}")
        else:
             # Fallback if no conversation corrections found: Extract *more* from podcast or simple idioms
             final_takeaways.append("🗣️ I'd love to chat more about this topic.")
             
        # Emergency backup if EVERYTHING failed
        if not final_takeaways:
             final_takeaways = [
                 "🎧 The weather is beautiful today.",
                 "🎧 I'm really enjoying this conversation.",
                 "🎧 Practice makes progress."
             ]

        return FeedbackResponse(
            conversation_id=request.conversation_id,
            feedback_content=FeedbackContent(takeaways=final_takeaways),
            created_at=datetime.now().isoformat()
        )

    except Exception as e:
        print(f"Error generating feedback: {e}")
        # Return a safe error response instead of 500
        return FeedbackResponse(
            conversation_id=request.conversation_id,
            feedback_content=FeedbackContent(takeaways=["⚠️ System error generating feedback. Please try again."]),
            created_at=datetime.now().isoformat()
        )
