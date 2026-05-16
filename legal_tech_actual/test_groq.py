import json
import os
from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set")
client = Groq(api_key=GROQ_API_KEY)

system_prompt = """
You are an expert AI legal assistant. Analyze the provided legal contract and return a JSON object with the following structure:
{
  "summary": "Plain English summary of the contract",
  "risk_score": 5,
  "risky_clauses": [
    {"clause": "Clause text or description", "reason": "Why it is risky"}
  ],
  "recommendations": ["Suggestion 1", "Suggestion 2"],
  "deadlines": ["Deadline 1 or 'None found'", "Deadline 2"]
}
Explain everything simply for freelancers and startups.
IMPORTANT: Return ONLY valid JSON.
"""

try:
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": "Analyze this contract:\n\nThis is a test contract between Party A and Party B. Party B must pay $1000."
            }
        ],
        model="llama3-70b-8192",
        temperature=0.2,
        response_format={"type": "json_object"}
    )
    print(chat_completion.choices[0].message.content)
except Exception as e:
    print(f"Error: {str(e)}")
