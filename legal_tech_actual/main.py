from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
import traceback
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from utils.pdf_parser import extract_text_from_file
from utils.groq_analysis import analyze_contract
from utils.chatbot import ask_chatbot, ask_general_chatbot

app = FastAPI(title="Legal Contract Analyzer API")

# Fetch allowed origins from environment variable, falling back to local configurations
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

os.makedirs("uploads", exist_ok=True)

# In-memory store: document_id -> extracted text
document_store: dict[str, str] = {}

ALLOWED_EXTENSIONS = ('.pdf', '.docx', '.jpg', '.jpeg', '.png')


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    document_id: str
    question: str
    history: Optional[List[ChatMessage]] = []


class AnalyzeRequest(BaseModel):
    document_id: str


class GeneralChatRequest(BaseModel):
    question: str
    history: Optional[List[ChatMessage]] = []


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename or ""
    if not filename.lower().endswith(ALLOWED_EXTENSIONS):
        return JSONResponse(
            status_code=400,
            content={"error": f"Unsupported file type. Please upload: {', '.join(ALLOWED_EXTENSIONS)}"}
        )

    try:
        content = await file.read()

        if len(content) == 0:
            return JSONResponse(status_code=400, content={"error": "Uploaded file is empty."})

        # Save to disk
        doc_id = str(uuid.uuid4())
        safe_name = "".join(c for c in filename if c.isalnum() or c in "._-")
        file_path = os.path.join("uploads", f"{doc_id}_{safe_name}")
        with open(file_path, "wb") as f:
            f.write(content)

        # Extract text
        extracted_text = extract_text_from_file(content, filename)
        document_store[doc_id] = extracted_text

        return {
            "document_id": doc_id,
            "filename": filename,
            "characters_extracted": len(extracted_text),
            "message": "File uploaded and text extracted successfully."
        }

    except ValueError as e:
        return JSONResponse(status_code=422, content={"error": str(e)})
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": f"Upload failed: {str(e)}"})


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    if req.document_id not in document_store:
        return JSONResponse(status_code=404, content={"error": "Document not found. Please upload again."})

    text = document_store[req.document_id]
    try:
        result = analyze_contract(text)
        return result
    except ValueError as e:
        return JSONResponse(status_code=422, content={"error": str(e)})
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": f"Analysis failed: {str(e)}"})


@app.post("/chat")
async def chat(req: ChatRequest):
    if req.document_id not in document_store:
        return JSONResponse(status_code=404, content={"error": "Document not found. Please upload again."})

    text = document_store[req.document_id]
    try:
        history_dicts = [{"role": m.role, "content": m.content} for m in (req.history or [])]
        response_text = ask_chatbot(text, req.question, history_dicts)
        return {"response": response_text}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": f"Chat failed: {str(e)}"})


@app.post("/general-chat")
async def general_chat(req: GeneralChatRequest):
    try:
        history_dicts = [{"role": m.role, "content": m.content} for m in (req.history or [])]
        response_text = ask_general_chatbot(req.question, history_dicts)
        return {"response": response_text}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": f"General Chat failed: {str(e)}"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
