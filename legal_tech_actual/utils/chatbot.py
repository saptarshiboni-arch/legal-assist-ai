import os
from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set")
client = Groq(api_key=GROQ_API_KEY)

def ask_chatbot(text_context: str, question: str, history: list = None) -> str:
    """Answer a question about the contract using LLaMA via Groq."""
    if history is None:
        history = []

    # Truncate context to stay within token limits
    truncated_context = text_context[:12000]

    system_prompt = f"""You are an expert AI legal assistant. A user has uploaded a legal contract and has questions about it.
Your job is to answer their questions clearly, accurately, and in plain English based ONLY on the contract text below.

Rules:
1. ONLY answer questions directly related to the provided contract text.
2. If the user asks something unrelated to the contract (e.g., general knowledge, math, life advice, or non-legal topics), politely state that you can only assist with questions about the analyzed document.
3. If the answer is in the contract, cite the relevant clause or section.
4. If the answer is NOT found in the contract, clearly say so.
5. Explain legal jargon in simple terms.
6. Format longer responses with clear bullet points for readability.

CONTRACT TEXT:
---
{truncated_context}
---
"""

    messages = [{"role": "system", "content": system_prompt}]
    
    # Add last 6 messages of history to stay within context limits
    for msg in history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": question})

    try:
        response = client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=1024,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        raise Exception(f"Chatbot error: {str(e)}")

def ask_general_chatbot(question: str, history: list = None) -> str:
    """Answer general legal queries."""
    if history is None:
        history = []

    system_prompt = """You are LegalAssist-AI, a specialized legal intelligence assistant.
Your goal is to answer questions strictly related to legal matters, law, regulations, and legal concepts.

Rules:
1. ONLY answer questions that are legal in nature.
2. If a user asks a non-legal question (e.g., general knowledge, math, coding, life advice), politely decline and state: "I am a specialized legal assistant and can only help with legal-related queries. For this topic, you may want to consult other specialized sources or search engines."
3. Be clear, professional, and accurate.
4. Always include this disclaimer at the end: "Disclaimer: I am an AI, not an attorney. This information is for educational purposes only and does not constitute legal advice."
5. Format responses with bullet points for readability.
"""

    messages = [{"role": "system", "content": system_prompt}]
    
    # Add last 6 messages of history
    for msg in history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": question})

    try:
        response = client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            max_tokens=1024,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        raise Exception(f"General Chatbot error: {str(e)}")
