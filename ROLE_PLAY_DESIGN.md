# AI Role Play 设计文档

## 核心设计理念

**目标**：让用户主动思考并用英语表达，而不是简单复述台词

## TTS 和字幕说明

### TTS（Text-to-Speech）是什么？
- **TTS** = AI把文字转换成语音，让AI"说话"给你听
- 例如：AI说 "What do you think about this topic?"（你听到声音）

### 字幕是什么？
- **字幕** = 屏幕上显示的文字，方便你跟读和查看
- 例如：屏幕上显示 "What do you think about this topic?"（你看到文字）

### 两者的关系
- **AI说话时**：TTS生成语音 + 同时显示字幕（让你看到AI说了什么）
- **你跟读时**：显示原播客的字幕（让你知道要读什么）
- **你说话时**：Whisper识别你的语音 → 显示识别出的文字（让你确认自己说了什么）

## Role Play 设计机制

### 🎯 设计原则

1. **引导式对话**：AI通过提问引导用户表达，而不是让用户念台词
2. **鼓励简单表达**：接受用户用简单句子，不要求完美
3. **复述完善**：当用户表达不清晰时，AI用更好的方式复述，让用户学习
4. **自然对话**：模拟真实对话场景，而不是剧本表演

### 📋 对话流程设计

#### 场景1：基于播客片段的对话

**原播客片段示例：**
```
Host A: "What do you think about learning English through podcasts?"
Host B: "I think it's a great way because you can listen anytime, anywhere."
Host A: "That's true. And you can also practice speaking by repeating after them."
```

**Role Play 设计：**

**Step 1: 设定场景**
```
AI (Host A): "Hey! I heard you've been listening to our podcast. 
             What do you think about learning English this way?"
             
[显示字幕，等待用户回答]
```

**Step 2: 用户回答（可能的情况）**

**情况A：用户回答简单但清晰**
```
用户: "I like it. It's easy."
AI (Host A): "That's great! Yes, it is easy and convenient. 
             Can you tell me more? Like, when do you usually listen?"
             
[AI复述了用户的表达，并继续提问引导]
```

**情况B：用户表达不清晰**
```
用户: "嗯... 我觉得... 就是... 好..."
AI (Host A): "I understand you think it's good! 
             You could say: 'I think it's good because I can practice anytime.'
             What makes it good for you?"
             
[AI帮助完善表达，并继续引导]
```

**情况C：用户用中文**
```
用户: "我觉得很方便"
AI (Host A): "I see! You think it's convenient. 
             Try saying: 'I think it's convenient.'
             Can you tell me why?"
             
[AI理解用户意思，鼓励用英语表达]
```

**情况D：用户沉默太久**
```
[5秒无响应]
AI (Host A): "No worries! You can say something simple like 
             'I like it' or 'It's helpful.' 
             What do you think?"
             
[AI提供简单选项，降低压力]
```

### 🎨 对话策略

#### 1. 提问引导策略

**不使用：**
- ❌ "Now say: 'I think it's a great way...'"（直接让念台词）

**使用：**
- ✅ "What do you think about this?"（开放式问题）
- ✅ "Can you give me an example?"（引导举例）
- ✅ "Why do you think so?"（引导解释）

#### 2. 复述完善策略

**当用户表达不清晰时：**

```
用户: "I... um... like... good"
AI: "I understand! You like it and think it's good. 
    You could say: 'I like it because it's helpful.'
    What specifically do you like about it?"
```

**关键点：**
- ✅ 先肯定用户的意思（"I understand!"）
- ✅ 用更好的方式复述（"You could say..."）
- ✅ 继续提问，鼓励更多表达

#### 3. 鼓励策略

**使用正面反馈：**
- ✅ "That's a great point!"
- ✅ "I like how you put it!"
- ✅ "Exactly! You're getting it!"

**接受不完美：**
- ✅ 接受简单句子
- ✅ 接受语法小错误（不影响理解就不纠正）
- ✅ 鼓励继续表达，而不是打断纠正

#### 4. 难度调节

**根据用户水平调整：**
- **初学者**：使用简单问题，提供选项
  - "Do you like it? Yes or no?"
- **中级**：开放式问题，引导详细回答
  - "What do you think about this method?"
- **高级**：深入讨论，挑战观点
  - "Some people say podcasts aren't interactive enough. What's your take?"

### 🔧 技术实现

#### System Prompt 设计

```python
system_prompt = """
You are Host A from All Ears English podcast. 
You're having a friendly conversation with a language learner.

Your role:
1. Guide the conversation naturally, don't make them recite lines
2. Ask open-ended questions to encourage them to express themselves
3. If they struggle, help by rephrasing their thoughts in better English
4. Accept simple answers and encourage them to say more
5. Be patient and supportive - they're learning!

Conversation style:
- Friendly and encouraging
- Use simple, clear language
- Ask follow-up questions
- Rephrase their ideas when they struggle

Example:
User: "I... um... like it"
You: "Great! I'm glad you like it. You could say: 'I like it because it's convenient.'
     What do you like most about it?"

Context from podcast:
{context}

Now continue the conversation naturally based on this context.
"""
```

#### 对话状态管理

```python
conversation_state = {
    "context": "原播客片段内容",
    "user_level": "intermediate",  # 根据用户回答判断
    "conversation_turns": 0,
    "topics_discussed": [],
    "user_struggles": []  # 记录用户困难点，用于反馈
}
```

#### 响应生成逻辑

```python
def generate_ai_response(user_message, context, conversation_state):
    # 1. 分析用户回答
    user_analysis = analyze_user_response(user_message)
    
    # 2. 根据情况生成回复
    if user_analysis["needs_help"]:
        # 用户表达困难，需要帮助
        response = generate_helpful_response(user_message, context)
    elif user_analysis["too_simple"]:
        # 回答太简单，引导深入
        response = generate_follow_up_question(context)
    else:
        # 正常对话
        response = generate_natural_response(user_message, context)
    
    return response
```

### 📊 对话示例（完整流程）

**场景：讨论"通过播客学英语"**

```
AI: "Hi! I heard you've been practicing with our podcast. 
    What do you think about learning English this way?"
    [显示字幕]

用户: "I think... good"
[Whisper识别显示：I think... good]

AI: "That's great! I'm glad you think it's good. 
    You could say: 'I think it's good because I can practice anytime.'
    What makes it good for you?"
    [显示字幕，TTS播放]

用户: "I can listen... anywhere"
[Whisper识别显示：I can listen... anywhere]

AI: "Exactly! That's a great point. 
    'I can listen anywhere' - that's the convenience of podcasts!
    Do you listen while commuting or at home?"
    [显示字幕，TTS播放]

用户: "commuting"
[Whisper识别显示：commuting]

AI: "Perfect! Many people do that. 
    You could say: 'I usually listen while commuting.'
    How long is your commute?"
    [显示字幕，TTS播放]
```

### 🎯 关键设计点总结

1. **不是念台词**：通过提问引导，让用户主动表达
2. **接受不完美**：鼓励简单表达，不要求完美语法
3. **复述帮助**：当用户困难时，用更好的方式复述
4. **持续引导**：通过追问，鼓励用户说更多
5. **正面反馈**：多鼓励，少纠正，保持对话流畅

### 💡 用户体验优化

1. **视觉提示**：
   - AI说话时：显示AI说的话（字幕）
   - 用户说话时：显示识别出的文字（实时反馈）
   - 等待用户时：显示"正在听..."或提示问题

2. **音频提示**：
   - AI说完后：播放"ding"提示音，表示轮到你说话
   - 用户说话时：显示波形图，表示正在录音

3. **帮助功能**：
   - "提示"按钮：显示一些可能的回答选项
   - "跳过"按钮：如果卡住了可以跳过这个问题
   - "重说"按钮：重新说一遍
