# LexAI - MERN + Legal Tech Integration - Complete Setup & Testing Guide

## 📋 Project Overview

This is a fully integrated application combining:

- **MERN Frontend**: React app with authentication (Vite)
- **MERN Backend**: Express.js with MongoDB
- **Legal Tech Backend**: FastAPI with Groq AI integration
- **Legal Tech Frontend**: React component integrated into MERN

## 🚀 Quick Start - Running All Services

### Prerequisites

- Node.js (v16+)
- Python (3.8+)
- MongoDB running locally or connection string
- Groq API key (for contract analysis)

### Step 1: Configure Environment Variables

**legal_tech_actual/.env**

```
GROQ_API_KEY=your_groq_api_key_here
```

**mern-auth/server/.env**

```
MONGODB_URI=mongodb://localhost:27017/lexai
JWT_SECRET=your_jwt_secret_key
REFRESH_SECRET=your_refresh_secret_key
PORT=5000
CLIENT_URL=http://localhost:5173
SENDER_EMAIL=your_email@gmail.com
SENDER_PASSWORD=your_app_password
```

**mern-auth/client/.env** (if needed)

```
VITE_API_URL=http://localhost:5000
```

### Step 2: Start Services in Separate Terminals

**Terminal 1 - FastAPI (Legal Tech Backend)**

```bash
cd c:\Users\AMD\Desktop\sagnik\legal_tech_actual
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Expected output: `Uvicorn running on http://127.0.0.1:8000`

**Terminal 2 - Express.js Backend (MERN)**

```bash
cd c:\Users\AMD\Desktop\sagnik\mern-auth\server
npm install
npm run dev
```

Expected output: `Server is running on Port: 5000`

**Terminal 3 - React Frontend (MERN)**

```bash
cd c:\Users\AMD\Desktop\sagnik\mern-auth\client
npm install
npm run dev
```

Expected output: `Local: http://localhost:5173/`

---

## 🧪 Testing the Integration

### Test 1: User Authentication Flow

1. Open http://localhost:5173 in your browser
2. Click "Create One" to go to Sign Up
3. Fill in the form:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `TestPassword123`
4. Click "Create Account"
   - ✅ Should see loading spinner
   - ✅ Should be redirected to `/legal-tech` page
   - ✅ User name should appear in top navbar

### Test 2: Login Flow

1. Logout from the legal tech page (top right button)
2. Should redirect to home page with login button
3. Click "Sign In"
4. Enter credentials:
   - Email: `test@example.com`
   - Password: `TestPassword123`
5. Click "Sign In"
   - ✅ Should redirect to `/legal-tech` page
   - ✅ User data should display correctly

### Test 3: Contract Upload & Analysis

1. On the Legal Tech page, you should see the upload interface
2. Drag and drop a PDF/DOCX file OR click to browse
3. Select a contract file (PDF, DOCX, JPG, PNG)
   - ✅ Should see loading indicator
   - ✅ "Uploading and extracting text..." message
   - ✅ "Analyzing contract with AI..." message

### Test 4: Analysis Results Display

After analysis completes, you should see:

- ✅ Risk Score (0-10)
- ✅ Risk Clauses count
- ✅ Deadlines count
- ✅ Contract Summary
- ✅ Contract Details (type, parties)
- ✅ Risk Analysis with severity badges
- ✅ AI Suggestions
- ✅ Chat interface ready

### Test 5: AI Chatbot

1. In the chat section (right side), type a question:
   - "Is this contract risky?"
   - "Can they terminate anytime?"
   - "Who owns the IP?"
2. Click send button or press Enter
   - ✅ Message should appear in chat
   - ✅ Bot should respond with analysis
   - ✅ Conversation history maintained

### Test 6: UI/UX Features

- ✅ **Dark/Light Theme**: Click theme toggle in navbar
- ✅ **Logout**: Click logout button - should redirect to home
- ✅ **Back Button**: In dashboard, should return to upload screen
- ✅ **Responsive Design**: Try on mobile/tablet - should adapt
- ✅ **Toast Notifications**: Should appear for errors/success

### Test 7: Error Handling

Try these to test error handling:

1. **Invalid file type**: Try uploading a .txt file
   - ✅ Should show error: "Unsupported file type"

2. **Network error**: Stop FastAPI backend, try to upload
   - ✅ Should show error message gracefully

3. **Large file**: Upload a very large PDF
   - ✅ Should handle timeout or show loading

---

## 📁 File Structure

```
mern-auth/
├── server/
│   ├── main.js
│   ├── server.js
│   ├── config/
│   │   ├── mongodb.js
│   │   └── nodemailer.js
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── models/
│
└── client/
    ├── src/
    │   ├── pages/
    │   │   ├── Home.jsx ✨ (Updated for redirect)
    │   │   ├── Login.jsx ✨ (Enhanced UI)
    │   │   ├── LegalTech.jsx ✨ (New!)
    │   │   ├── EmailVerify.jsx
    │   │   └── ResetPassword.jsx
    │   ├── components/
    │   │   ├── Header.jsx ✨ (Enhanced)
    │   │   ├── Navbar.jsx
    │   ├── styles/
    │   │   └── LegalTech.css ✨ (New!)
    │   ├── context/
    │   │   └── AppContext.jsx
    │   ├── App.jsx ✨ (Updated routing)
    │   └── index.css
    └── package.json

legal_tech_actual/
├── main.py ✨ (Updated with CORS)
├── requirements.txt
├── static/
│   ├── app.js
│   └── style.css
├── templates/
│   ├── index.html
│   └── script.js
├── utils/
│   ├── pdf_parser.py
│   ├── groq_analysis.py
│   └── chatbot.py
└── uploads/

✨ = Modified/Created files
```

---

## 🔧 API Integration Details

### Legal Tech API Endpoints (FastAPI on localhost:8000)

| Method | Endpoint   | Purpose                     |
| ------ | ---------- | --------------------------- |
| GET    | `/`        | HTML interface              |
| POST   | `/upload`  | Upload contract file        |
| POST   | `/analyze` | Analyze uploaded contract   |
| POST   | `/chat`    | Chat with AI about contract |

### CORS Configuration

The FastAPI app now allows requests from:

- `http://localhost:5173` (Vite dev)
- `http://localhost:5174`
- `http://localhost:5175`
- `http://localhost:3000` (standard React dev)

### Request/Response Format

**Upload Request**

```
POST /upload
Content-Type: multipart/form-data
Body: [file]
```

**Upload Response**

```json
{
  "document_id": "uuid-string",
  "filename": "contract.pdf"
}
```

**Analyze Request**

```json
{
  "document_id": "uuid-string"
}
```

**Analyze Response**

```json
{
  "contract_type": "Service Agreement",
  "risk_score": "7",
  "risk_summary": "...",
  "parties": ["Party A", "Party B"],
  "deadlines": ["90 days", "..."],
  "summary": "...",
  "key_obligations": [...],
  "risky_clauses": [...],
  "missing_protections": [...],
  "recommendations": [...],
  "favorable_clauses": [...]
}
```

---

## 🎨 UI/UX Improvements Made

### Login/Signup Page

✅ Enhanced with gradient backgrounds
✅ Added loading state with spinner
✅ Better form field styling with icons
✅ Security badge at bottom
✅ Smooth transitions and hover effects
✅ Better error messages via toast notifications

### Header Component

✅ Improved greeting message
✅ Better styled "Get Started" button
✅ Direct navigation to LegalTech page
✅ Gradient text effects
✅ Added icon before button

### LegalTech Page

✅ Professional dark/light theme toggle
✅ Beautiful upload card with drag-and-drop
✅ Real-time analysis progress
✅ Risk score visualization
✅ Responsive grid layout
✅ Smooth animations
✅ Chat interface with message history
✅ Glassmorphism effects throughout

---

## 🐛 Troubleshooting

### Issue: "Cannot POST /upload"

**Solution**: Make sure FastAPI backend is running on port 8000

### Issue: CORS Error in Console

**Solution**: Check CORS configuration in `legal_tech_actual/main.py` includes your frontend URL

### Issue: Chat not working

**Solution**: Verify Groq API key is set and valid in `.env`

### Issue: MongoDB connection error

**Solution**: Check MongoDB URI in `.env` and ensure MongoDB service is running

### Issue: Vite server won't start

**Solution**:

```bash
npm cache clean --force
rm -r node_modules
npm install
npm run dev
```

### Issue: File upload fails

**Solution**:

1. Check file format (PDF, DOCX, JPG, PNG only)
2. Check file size (should be < 10MB)
3. Check uploads folder permissions

---

## 📚 Key Features

- ✅ Secure user authentication with JWT
- ✅ Email verification workflow
- ✅ Password reset functionality
- ✅ Contract analysis with AI
- ✅ Real-time chat with AI
- ✅ Risk detection and scoring
- ✅ Dark/Light theme support
- ✅ Fully responsive design
- ✅ Professional UI/UX
- ✅ Error handling and validation

---

## 🚀 Deployment Notes

For production deployment:

1. Update `LEGAL_TECH_API` URL in `LegalTech.jsx` to production server
2. Update CORS origins in `legal_tech_actual/main.py`
3. Set proper environment variables
4. Enable HTTPS
5. Set secure cookie flags
6. Add rate limiting
7. Add request validation
8. Set up proper logging

---

## 📞 Support

For issues or questions, check:

1. Console for error messages (F12)
2. Network tab for failed requests
3. Terminal output for backend errors
4. Application logs

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
