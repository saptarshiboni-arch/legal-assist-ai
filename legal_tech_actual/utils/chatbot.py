import os
from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set")
client = Groq(api_key=GROQ_API_KEY)

def ask_chatbot(text_context: str, question: str, history: list = None, analysis_context: dict = None) -> str:
    """Answer a question about the contract using LLaMA via Groq, incorporating AI analysis results."""
    if history is None:
        history = []

    # Truncate context to stay within token limits
    truncated_context = text_context[:12000]

    # Structure the AI analysis findings to help explain output cards
    analysis_str = ""
    if analysis_context:
        analysis_str = f"""
AI-GENERATED CONTRACT ANALYSIS (currently visible on the user's dashboard UI):
---
- Contract Type: {analysis_context.get('contract_type', 'Unknown')}
- Parties Involved: {', '.join(analysis_context.get('parties', []))}
- Risk Score: {analysis_context.get('risk_score', '0')}/10
- Risk Summary: {analysis_context.get('risk_summary', 'N/A')}

- Risky Clauses Found:"""
        
        risky_clauses = analysis_context.get('risky_clauses', [])
        if risky_clauses:
            for i, clause in enumerate(risky_clauses):
                analysis_str += f"\n  * Clause {i+1}: {clause.get('title', 'Risk Clause')} (Severity: {clause.get('severity', 'High')})\n    - Reason: {clause.get('reason', 'N/A')}\n    - Quote/Text: \"{clause.get('clause', 'N/A')}\""
        else:
            analysis_str += "\n  * None identified."
            
        analysis_str += "\n\n- AI Suggestions / Recommendations:"
        recommendations = analysis_context.get('recommendations', [])
        if recommendations:
            for rec in recommendations:
                analysis_str += f"\n  * {rec}"
        else:
            analysis_str += "\n  * None"

        analysis_str += "\n\n- Deadlines / Key Timelines:"
        deadlines = analysis_context.get('deadlines', [])
        if deadlines:
            for deadline in deadlines:
                analysis_str += f"\n  * {deadline}"
        else:
            analysis_str += "\n  * None specified"
            
        analysis_str += "\n\n- Key Obligations:"
        key_obligations = analysis_context.get('key_obligations', [])
        if key_obligations:
            for ob in key_obligations:
                analysis_str += f"\n  * {ob}"
        else:
            analysis_str += "\n  * None specified"
            
        analysis_str += "\n\n- Missing Protections:"
        missing_protections = analysis_context.get('missing_protections', [])
        if missing_protections:
            for missing in missing_protections:
                analysis_str += f"\n  * {missing}"
        else:
            analysis_str += "\n  * None identified"

        analysis_str += "\n\n- Favorable Clauses:"
        favorable_clauses = analysis_context.get('favorable_clauses', [])
        if favorable_clauses:
            for fav in favorable_clauses:
                analysis_str += f"\n  * {fav}"
        else:
            analysis_str += "\n  * None identified"
        analysis_str += "\n---\n"

    system_prompt = f"""You are an expert AI legal assistant. A user has uploaded a legal contract and has questions about it.
Your job is to answer their questions clearly, accurately, and in plain English based on the raw contract text AND the AI-generated contract analysis findings.

If the user asks questions regarding the AI outputs shown on their screen—such as the Risk Score, Risk Clauses, AI Suggestions/Recommendations, Deadlines, Contract Summary, or Contract Details—you MUST use the AI-generated analysis below to explain and elaborate on them.

{analysis_str}

CONTRACT TEXT:
---
{truncated_context}
---

Rules:
1. Undergo a professional, legal-expert tone. Answer clearly and in plain English.
2. If the user asks about dashboard cards (Risk Score, Risk Clauses, AI Suggestions, Deadlines), reference the AI-generated analysis.
3. If they ask about terms found in the original contract text, reference the raw CONTRACT TEXT and cite specific parts or clauses.
4. If the user asks something completely unrelated to the contract or legal queries, politely state that you can only assist with questions about this document.
5. Explain legal jargon in simple terms.
6. Format responses with bullet points, numbered lists, or bold highlights to maintain a beautiful, premium visual hierarchy.
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
