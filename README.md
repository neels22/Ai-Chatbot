# 🤖 AI Chatbot - Perplexity 2.0

A modern, full-stack AI chatbot application with real-time web search capabilities, powered by Google's Gemini AI and built with LangGraph agentic workflows. Features a sleek UI with real-time streaming responses and visual search stage indicators.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react)
![Next.js](https://img.shields.io/badge/Next.js-15.5.4-000000?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.117.1-009688?logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python)

---

## 🌐 Live Deployment

- **Frontend (Vercel)**: [https://perplexity.indraneelsarode.com](https://perplexity.indraneelsarode.com) 
- **Backend (Render)**: [https://ai-chatbot-server-e5v8.onrender.com](https://ai-chatbot-server-e5v8.onrender.com)

---

## 📋 Table of Contents

1. [Features](#-features)
2. [Tech Stack](#-tech-stack)
3. [Architecture](#-architecture)
4. [How It Works](#-how-it-works)
5. [Components](#-components)
6. [Project Structure](#-project-structure)
7. [Installation](#-installation)
8. [Environment Variables](#-environment-variables)
9. [API Endpoints](#-api-endpoints)
10. [Deployment](#-deployment)
11. [Usage](#-usage)

---

## ✨ Features

### Core Functionality
- 🤖 **AI-Powered Conversations**: Powered by Google Gemini 2.5 Flash model for intelligent responses
- 🔍 **Real-Time Web Search**: Integrated Tavily search for up-to-date information
- 💬 **Streaming Responses**: Real-time streaming of AI responses using Server-Sent Events (SSE)
- 🧠 **Conversation Memory**: Maintains context across multiple messages using LangGraph checkpointing
- 🎯 **Agentic Workflow**: Uses LangGraph for sophisticated tool-calling and decision-making

### UI/UX Features
- 🎨 **Modern Glassmorphic Design**: Beautiful gradient UI with backdrop blur effects
- 📊 **Visual Search Stages**: Real-time visualization of search process (Searching → Reading → Writing)
- ⚡ **Instant Feedback**: Loading animations and typing indicators
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🌈 **Smooth Animations**: Polished transitions and hover effects

### Technical Features
- 🔄 **Stateful Conversations**: Thread-based conversation management with unique checkpoint IDs
- 🛠️ **Tool Integration**: Seamless integration of external tools (web search)
- 🚀 **Asynchronous Processing**: Fully async backend for optimal performance
- 🔌 **CORS Enabled**: Ready for cross-origin requests
- 📡 **Event-Driven Architecture**: SSE for real-time bidirectional communication

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 15.5.4 | React framework for production |
| **React** | 19.1.0 | UI library |
| **TypeScript** | ^5 | Type safety |
| **Tailwind CSS** | ^4 | Utility-first CSS framework |
| **PostCSS** | ^4 | CSS processing |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **FastAPI** | 0.117.1 | High-performance web framework |
| **Python** | 3.13 | Programming language |
| **LangChain** | 0.3.27 | LLM application framework |
| **LangGraph** | 0.6.7 | Agentic workflow orchestration |
| **Google Gemini** | 2.5-flash | Large language model |
| **Tavily Search** | 0.7.12 | Web search API |
| **Uvicorn** | 0.37.0 | ASGI server |

### Key Dependencies

#### Frontend
```json
{
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "next": "15.5.4",
  "typescript": "^5",
  "tailwindcss": "^4"
}
```

#### Backend
```txt
fastapi==0.117.1
langchain==0.3.27
langgraph==0.6.7
langchain-google-genai==2.1.12
langchain-community==0.3.30
tavily-python==0.7.12
uvicorn==0.37.0
python-dotenv==1.1.1
```

---

## 🏗️ Architecture

### System Overview

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   Client    │  HTTP   │   FastAPI   │  API    │    Gemini    │
│  (Next.js)  │────────▶│   Backend   │────────▶│      AI      │
│             │  SSE    │             │         │              │
└─────────────┘◀────────└─────────────┘         └──────────────┘
                              │
                              │ API
                              ▼
                        ┌──────────────┐
                        │    Tavily    │
                        │  Web Search  │
                        └──────────────┘
```

### LangGraph Workflow

The backend uses LangGraph to create a sophisticated agentic workflow:

```
┌──────────┐
│  START   │
└────┬─────┘
     │
     ▼
┌──────────────────┐
│  Model Node      │
│  (Gemini 2.5)    │
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│  Tools Router    │  ──────────────┐
│  (Conditional)   │                │
└────┬─────────────┘                │
     │                              │
     │ Has tool calls?              │ No tool calls
     │                              │
     ▼ Yes                          ▼
┌──────────────────┐           ┌─────────┐
│   Tool Node      │           │   END   │
│ (Tavily Search)  │           └─────────┘
└────┬─────────────┘
     │
     │ Loop back
     ▼
┌──────────────────┐
│  Model Node      │
│ (Process results)│
└──────────────────┘
```

### Data Flow

1. **User Input** → Client sends message via SSE connection
2. **Backend Processing**:
   - Receives message with optional checkpoint ID (for conversation continuity)
   - Routes through LangGraph workflow
   - Model decides if web search is needed
   - If search needed: executes Tavily search → processes results → generates response
   - If no search: generates direct response
3. **Streaming Response** → Backend streams events:
   - `checkpoint`: Session ID for conversation continuity
   - `content`: AI response chunks
   - `search_start`: Search initiation notification
   - `search_results`: URLs found
   - `end`: Stream completion
4. **Client Display** → Updates UI in real-time with streaming content and search stages

---

## 🔄 How It Works

### Conversation Flow

#### 1. **Initial Message**
- User types a message and submits
- Frontend creates EventSource connection to backend
- Backend generates a unique `checkpoint_id` for the conversation thread
- LangGraph initializes conversation state with MemorySaver

#### 2. **AI Processing**
- Message flows through LangGraph state graph
- Gemini AI analyzes the query
- Decides whether external information is needed

#### 3. **Tool Execution (if needed)**
- If search required:
  - Backend sends `search_start` event with query
  - Tavily API performs web search (up to 4 results)
  - Backend sends `search_results` event with URLs
  - AI processes search results
  
#### 4. **Response Generation**
- AI generates response (with or without search context)
- Response streams back to client in chunks via `content` events
- Frontend updates UI in real-time

#### 5. **Subsequent Messages**
- Client includes `checkpoint_id` in follow-up requests
- Backend retrieves conversation history from memory
- Maintains context for coherent multi-turn conversations

### Search Stage Visualization

The UI displays three distinct stages when web search is triggered:

1. **🔍 Searching**: Shows the search query being executed
2. **📖 Reading**: Displays URLs being analyzed
3. **✍️ Writing**: Indicates AI is formulating response

---

## 🧩 Components

### Frontend Components

#### 1. **Header.tsx**
```typescript
Location: client/src/components/Header.tsx
Purpose: Top navigation bar with branding
Features:
  - Perplexity 2.0 branding with gradient logo
  - Chat button for future navigation
  - Gradient background with backdrop blur
```

#### 2. **MessageArea.tsx**
```typescript
Location: client/src/components/MessageArea.tsx
Purpose: Display conversation messages
Features:
  - User/AI message differentiation
  - Search stage visualization (SearchStages component)
  - Typing animation for loading states
  - Glassmorphic message bubbles
  - Gradient indicators for search progress
  - Auto-scroll to latest messages
```

**Sub-components:**
- `PremiumTypingAnimation`: Animated loading dots
- `SearchStages`: Visual representation of search process with timeline UI

#### 3. **InputBar.tsx**
```typescript
Location: client/src/components/InputBar.tsx
Purpose: Message input interface
Features:
  - Text input with placeholder
  - Submit button with hover animations
  - Emoji and attachment buttons (UI only)
  - Gradient send button with rotation effect
  - Auto-clear on submit
```

#### 4. **page.tsx**
```typescript
Location: client/src/app/page.tsx
Purpose: Main application page and state management
Features:
  - Message state management
  - EventSource SSE connection handling
  - Checkpoint ID management for conversations
  - Event parsing (checkpoint, content, search_start, search_results, end)
  - Error handling for connection failures
```

**Key State:**
- `messages`: Array of conversation messages
- `currentMessage`: Current input value
- `checkpointId`: Thread ID for conversation continuity

### Backend Components

#### 1. **State Graph (LangGraph)**
```python
Nodes:
  - model: AI model invocation (Gemini)
  - tool_node: Tool execution (Tavily search)

Edges:
  - model → tools_router (conditional)
  - tools_router → tool_node (if tools needed)
  - tools_router → END (if no tools)
  - tool_node → model (loop back)
```

#### 2. **FastAPI Application**
```python
Routes:
  - GET /chat_stream/{message}
    Query Params: checkpoint_id (optional)
    Response: Server-Sent Events stream

Middleware:
  - CORS: Allows cross-origin requests
```

#### 3. **Memory System**
```python
Component: MemorySaver
Purpose: Persist conversation state
Storage: In-memory (thread-based)
Key: thread_id (checkpoint_id)
```

---

## 📁 Project Structure

```
Ai-Chatbot/
│
├── client/                          # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout
│   │   │   ├── page.tsx            # Main chat page (state management)
│   │   │   ├── globals.css         # Global styles
│   │   │   └── favicon.ico         # Favicon
│   │   │
│   │   └── components/
│   │       ├── Header.tsx          # Navigation header
│   │       ├── InputBar.tsx        # Message input component
│   │       └── MessageArea.tsx     # Messages display + search stages
│   │
│   ├── public/                     # Static assets
│   ├── package.json                # Frontend dependencies
│   ├── tsconfig.json               # TypeScript config
│   ├── next.config.ts              # Next.js configuration
│   ├── postcss.config.mjs          # PostCSS config
│   └── tailwind.config.js          # Tailwind CSS config
│
├── server/                         # FastAPI Backend
│   ├── app.py                      # Main application file
│   │   ├── State (TypedDict)      # LangGraph state definition
│   │   ├── model()                # AI model node
│   │   ├── tool_node()            # Search tool node
│   │   ├── tools_router()         # Conditional routing
│   │   └── chat_stream endpoint   # SSE streaming endpoint
│   │
│   ├── requirements.txt            # Python dependencies
│   ├── Dockerfile                  # Docker configuration
│   ├── venv/                       # Virtual environment
│   └── app.ipynb                   # Development notebook
│
└── README.md                       # This file
```

---

## 🚀 Installation

### Prerequisites

- **Node.js**: v18+ (for Next.js 15)
- **Python**: 3.10+ (3.13 recommended)
- **npm** or **yarn**
- **pip** (Python package manager)

### Backend Setup

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**
   ```bash
   # macOS/Linux
   source venv/bin/activate
   
   # Windows
   venv\Scripts\activate
   ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Create `.env` file**
   ```bash
   touch .env
   ```

6. **Add environment variables** (see [Environment Variables](#-environment-variables))

7. **Run the server**
   ```bash
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

   Server will start at: `http://localhost:8000`

### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Update API endpoint** (if running locally)
   
   Edit `client/src/app/page.tsx` line 75:
   ```typescript
   let url = `http://localhost:8000/chat_stream/${encodeURIComponent(userInput)}`;
   ```

4. **Run development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Frontend will start at: `http://localhost:3000`

---

## 🔐 Environment Variables

### Backend (`server/.env`)

```env
# Google Gemini API Key (Required)
GOOGLE_API_KEY=your_google_api_key_here

# Tavily Search API Key (Required)
TAVILY_API_KEY=your_tavily_api_key_here

# Optional: OpenAI (if switching models)
# OPENAI_API_KEY=your_openai_api_key_here
```

#### How to Get API Keys:

1. **Google Gemini API Key**:
   - Visit: [https://ai.google.dev/](https://ai.google.dev/)
   - Sign up and create a new project
   - Enable Gemini API and generate key

2. **Tavily API Key**:
   - Visit: [https://tavily.com/](https://tavily.com/)
   - Sign up for an account
   - Navigate to API section and generate key

### Frontend

No environment variables required for production build. API endpoint is hardcoded to Render deployment.

For local development, update the backend URL in `page.tsx`.

---

## 📡 API Endpoints

### Base URL
- **Production**: `https://ai-chatbot-server-e5v8.onrender.com`
- **Local**: `http://localhost:8000`

### Endpoints

#### `GET /chat_stream/{message}`

**Description**: Stream chat responses with optional conversation continuity

**Parameters**:
- `message` (path, required): User's message (URL-encoded)
- `checkpoint_id` (query, optional): Thread ID for continuing conversation

**Response**: Server-Sent Events (SSE) stream

**Event Types**:

```typescript
// 1. Checkpoint ID (first message only)
{
  "type": "checkpoint",
  "checkpoint_id": "uuid-string"
}

// 2. Content chunks (streaming)
{
  "type": "content",
  "content": "response text chunk"
}

// 3. Search start notification
{
  "type": "search_start",
  "query": "search query"
}

// 4. Search results
{
  "type": "search_results",
  "urls": ["url1", "url2", ...]
}

// 5. Stream end
{
  "type": "end"
}

// 6. Error (if any)
{
  "type": "error",
  "message": "error description"
}
```

**Example Requests**:

```bash
# New conversation
curl "https://ai-chatbot-server-e5v8.onrender.com/chat_stream/Hello%20there"

# Continue conversation
curl "https://ai-chatbot-server-e5v8.onrender.com/chat_stream/Tell%20me%20more?checkpoint_id=abc-123-def-456"
```

---

## 🌍 Deployment

### Frontend (Vercel)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Deploy frontend"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure:
     - Framework Preset: `Next.js`
     - Root Directory: `client`
     - Build Command: `npm run build`
     - Output Directory: `.next`

3. **Deploy**: Vercel auto-deploys on push to main branch

**Configuration**:
- Auto-detects Next.js
- Handles SSR and API routes
- Provides instant preview deployments for PRs

### Backend (Render)

1. **Create Render account**: [render.com](https://render.com)

2. **Create New Web Service**:
   - Connect GitHub repository
   - Configure:
     - **Name**: `ai-chatbot-server`
     - **Region**: Choose closest to users
     - **Branch**: `main`
     - **Root Directory**: `server`
     - **Runtime**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`

3. **Add Environment Variables**:
   - Go to Environment tab
   - Add:
     - `GOOGLE_API_KEY`
     - `TAVILY_API_KEY`

4. **Deploy**: Render auto-builds and deploys

**Free Tier Notes**:
- Backend may "spin down" after inactivity
- First request after inactivity takes ~30-60s (cold start)
- Consider upgrading for production use

### Docker Deployment (Alternative)

```dockerfile
# server/Dockerfile exists in project
# To deploy with Docker:

# Build
docker build -t ai-chatbot-backend ./server

# Run
docker run -p 8000:8000 \
  -e GOOGLE_API_KEY=your_key \
  -e TAVILY_API_KEY=your_key \
  ai-chatbot-backend
```

---

## 💡 Usage

### Basic Chat

1. Open the application
2. Type your message in the input bar
3. Press Enter or click the send button
4. Watch the AI respond in real-time

### Web Search Queries

Ask questions that require current information:

```
"What's the latest news about AI?"
"Who won the Super Bowl in 2024?"
"What are the current stock prices for Apple?"
```

The chatbot will automatically:
1. Detect need for web search
2. Show "Searching the web" stage
3. Display URLs being analyzed
4. Show "Writing answer" stage
5. Provide AI-generated summary

### Conversation Continuity

The chatbot maintains context:

```
User: "What is React?"
AI: [Explains React]

User: "What about its hooks?"
AI: [Explains React hooks with context from previous message]
```

Each conversation is tracked via checkpoint IDs.

---

## 🎨 UI Features

### Design System

**Color Palette**:
- Primary: Teal (`#14B8A6`) / Cyan (`#06B6D4`)
- Background: Slate 900-950
- Accent: Purple 900

**Typography**:
- Font: System UI fonts
- Weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

**Effects**:
- Glassmorphism: `backdrop-blur-xl`
- Gradients: Linear gradients for buttons and backgrounds
- Shadows: Colored shadows with glow effects
- Animations: Smooth transitions (300ms duration)

### Responsive Breakpoints

- Desktop: Full 70% width container
- Tablet: Adapts with Tailwind responsive classes
- Mobile: Full-width with padding

---

## 🔧 Customization

### Change AI Model

Edit `server/app.py` line 30:

```python
# Use OpenAI instead of Gemini
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-4o")

# Or use different Gemini model
llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro")
```

### Adjust Search Results Count

Edit `server/app.py` line 23:

```python
search_tool = TavilySearchResults(
    max_results=10,  # Change from 4 to 10
)
```

### Customize UI Theme

Edit `client/src/app/globals.css` for global styles or modify Tailwind classes in components.

---

## 📊 Performance Considerations

### Backend
- **Async Operations**: All I/O operations are asynchronous
- **Streaming**: Reduces perceived latency with SSE
- **Memory Management**: In-memory checkpointing (consider Redis for production)

### Frontend
- **Event-Driven**: SSE for efficient server→client communication
- **Optimistic Updates**: UI updates immediately on user input
- **Lazy Loading**: Components render only when needed

### Optimization Tips
1. **Use Redis**: For persistent conversation memory in production
2. **Rate Limiting**: Implement on backend to prevent abuse
3. **Caching**: Cache frequent queries
4. **CDN**: Serve static assets via CDN
5. **Error Boundaries**: Add React error boundaries for better UX

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **CORS Errors**
```
Error: CORS policy blocked
```
**Solution**: Ensure backend CORS middleware includes your frontend origin

#### 2. **EventSource Connection Failed**
```
EventSource failed to connect
```
**Solution**: 
- Check backend is running
- Verify URL in `page.tsx`
- Check Render service status (if deployed)

#### 3. **API Key Errors**
```
Error: API key not found
```
**Solution**: 
- Verify `.env` file exists in `server/`
- Check environment variables in Render dashboard
- Ensure `.env` is loaded with `load_dotenv()`

#### 4. **Search Not Working**
```
Tool call failed
```
**Solution**: 
- Verify Tavily API key is correct
- Check API quota/limits
- Review console logs for detailed error

---

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📧 Contact

**Developer**: Indraneel Sarode  
**Project Link**: [https://github.com/yourusername/Ai-Chatbot](https://github.com/yourusername/Ai-Chatbot)

---

## 🙏 Acknowledgments

- [LangChain](https://www.langchain.com/) - LLM application framework
- [LangGraph](https://langchain-ai.github.io/langgraph/) - Agentic workflow orchestration
- [Google Gemini](https://ai.google.dev/) - Large language model
- [Tavily](https://tavily.com/) - Web search API
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

## 🎯 Roadmap

Future enhancements planned:

- [ ] User authentication and conversation history
- [ ] Multiple conversation threads
- [ ] Export conversations (PDF, MD)
- [ ] Code syntax highlighting in responses
- [ ] File upload support
- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Custom system prompts
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

---

**Built with ❤️ using Next.js, FastAPI, and LangGraph**
