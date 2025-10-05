# FastAPI Streaming Implementation - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Imports and Dependencies](#imports-and-dependencies)
4. [LangGraph Setup](#langgraph-setup)
5. [FastAPI Setup](#fastapi-setup)
6. [Server-Sent Events (SSE)](#server-sent-events-sse)
7. [Streaming Implementation](#streaming-implementation)
8. [Running the Application](#running-the-application)

---

## Overview

This application is an AI chatbot that combines:
- **LangGraph**: For building a conversational AI agent with tool usage
- **FastAPI**: For creating a web server with streaming responses
- **Server-Sent Events (SSE)**: For real-time streaming from server to client
- **OpenAI GPT-4**: As the language model
- **Tavily Search**: For web search capabilities

### What Makes This Special?
Instead of waiting for the entire AI response, this implementation **streams** the response in real-time, similar to ChatGPT's typing effect.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Sends: "What's the weather in Delhi?"                     │ │
│  │  + checkpoint_id (optional)                                │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                               │
└───────────────────┼───────────────────────────────────────────────┘
                    │ HTTP GET Request
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FASTAPI SERVER (app.py)                       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Endpoint: /chat_stream/{message}?checkpoint_id=...       │   │
│  └────────────────┬─────────────────────────────────────────┘   │
│                   │                                               │
│                   ▼                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ generate_chat_responses()                                │   │
│  │ (Async Generator Function)                               │   │
│  └────────────────┬─────────────────────────────────────────┘   │
│                   │                                               │
│                   ▼                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ LangGraph Agent Graph                                     │   │
│  │  ┌──────────┐     ┌──────────┐     ┌──────────┐         │   │
│  │  │  Model   │────▶│  Router  │────▶│   Tool   │         │   │
│  │  │   Node   │     │   Node   │     │   Node   │         │   │
│  │  └──────────┘     └──────────┘     └────┬─────┘         │   │
│  │       ▲                                  │               │   │
│  │       └──────────────────────────────────┘               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                   │                                               │
│                   │ Emits Events:                                 │
│                   │ • on_chat_model_stream                        │
│                   │ • on_chat_model_end                           │
│                   │ • on_tool_end                                 │
│                   │                                               │
│                   ▼                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ StreamingResponse (Server-Sent Events)                   │   │
│  │                                                           │   │
│  │ data: {"type": "checkpoint", "checkpoint_id": "..."}     │   │
│  │ data: {"type": "content", "content": "The"}              │   │
│  │ data: {"type": "content", "content": " weather"}         │   │
│  │ data: {"type": "search_start", "query": "..."}           │   │
│  │ data: {"type": "search_results", "urls": [...]}          │   │
│  │ data: {"type": "content", "content": " is"}              │   │
│  │ data: {"type": "end"}                                    │   │
│  └────────────────┬─────────────────────────────────────────┘   │
│                   │                                               │
└───────────────────┼───────────────────────────────────────────────┘
                    │ SSE Stream
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  Displays streaming response in real-time                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Imports and Dependencies

### Lines 1-12: Import Statements

```python
from typing import TypedDict, Annotated, Optional
```
- **`TypedDict`**: Used to define structured dictionaries with type hints
- **`Annotated`**: Allows adding metadata to type hints
- **`Optional`**: Indicates a value can be None

```python
from langgraph.graph import add_messages, StateGraph, END
```
- **`add_messages`**: A reducer function that intelligently merges message lists
- **`StateGraph`**: Core class for building state-based agent workflows
- **`END`**: Special constant indicating the graph should terminate

```python
from langchain_openai import ChatOpenAI
```
- Wrapper for OpenAI's chat models (GPT-4, GPT-3.5, etc.)

```python
from langchain_core.messages import HumanMessage, AIMessageChunk, ToolMessage
```
- **`HumanMessage`**: Represents user input
- **`AIMessageChunk`**: Represents a piece of AI response (for streaming)
- **`ToolMessage`**: Represents the result of a tool call

```python
from dotenv import load_dotenv
```
- Loads environment variables from `.env` file (API keys, secrets)

```python
from langchain_community.tools.tavily_search import TavilySearchResults
```
- Web search tool using Tavily API for real-time internet search

```python
from fastapi import FastAPI, Query
```
- **`FastAPI`**: The main web framework class
- **`Query`**: Used to define query parameters in URLs

```python
from fastapi.responses import StreamingResponse
```
- Special response type that streams data instead of sending it all at once

```python
from fastapi.middleware.cors import CORSMiddleware
```
- Middleware to handle Cross-Origin Resource Sharing (allows frontend to call backend)

```python
import json
from uuid import uuid4
```
- **`json`**: For converting Python objects to JSON strings
- **`uuid4`**: Generates unique identifiers for conversation threads

```python
from langgraph.checkpoint.memory import MemorySaver
```
- Saves conversation history in memory for maintaining context

---

## LangGraph Setup

### Lines 14-17: Initialize Memory and Load Environment

```python
load_dotenv()
```
**What it does**: Reads your `.env` file and loads variables like `OPENAI_API_KEY`, `TAVILY_API_KEY`

```python
# Initialize memory saver for checkpointing
memory = MemorySaver()
```
**What it does**: Creates an in-memory storage for conversation history. Each conversation thread is identified by a `thread_id` and can be retrieved later.

**Why we need it**: To maintain context across multiple messages in a conversation.

---

### Lines 19-20: Define State Schema

```python
class State(TypedDict):
    messages: Annotated[list, add_messages]
```

**What it does**: 
- Defines the structure of data that flows through the agent graph
- `messages`: A list that stores the conversation history
- `Annotated[list, add_messages]`: The `add_messages` function will be called whenever new messages are added to merge them intelligently

**Visual Representation**:
```
State Object:
{
    "messages": [
        HumanMessage(content="Hello"),
        AIMessage(content="Hi! How can I help?"),
        HumanMessage(content="What's the weather?"),
        ...
    ]
}
```

---

### Lines 22-26: Setup Search Tool

```python
search_tool = TavilySearchResults(
    max_results=4,
)

tools = [search_tool]
```

**What it does**:
- Creates a search tool that can query the internet
- `max_results=4`: Returns up to 4 search results
- Wraps it in a list for easy extension (you can add more tools later)

**Tool Response Format**:
```json
[
    {
        "url": "https://example.com/page1",
        "title": "Weather in Delhi",
        "content": "Current temperature is...",
        "score": 0.95
    },
    ...
]
```

---

### Lines 28-30: Initialize Language Model

```python
llm = ChatOpenAI(model="gpt-4o")

llm_with_tools = llm.bind_tools(tools=tools)
```

**What it does**:
- **Line 28**: Creates a GPT-4 language model instance
- **Line 30**: "Binds" the search tool to the model, enabling it to decide when to use the tool

**How Tool Binding Works**:
```
User: "What's the weather in Delhi?"
         ↓
GPT-4 (with tools) analyzes the question
         ↓
Decides: "I need to search the internet"
         ↓
Generates a tool call:
{
    "name": "tavily_search_results_json",
    "args": {"query": "current weather Delhi"},
    "id": "call_123"
}
```

---

### Lines 32-36: Model Node

```python
async def model(state: State):
    result = await llm_with_tools.ainvoke(state["messages"])
    return {
        "messages": [result], 
    }
```

**What it does**:
- **Line 32**: Defines an async function (can handle multiple requests simultaneously)
- **Line 33**: Sends all conversation messages to GPT-4 and waits for response
  - `ainvoke`: Async version of invoke (non-blocking)
  - `state["messages"]`: The entire conversation history
- **Lines 34-36**: Returns the AI's response wrapped in a dictionary

**Flow Diagram**:
```
Input State:                      Output State:
{                                 {
  "messages": [                     "messages": [
    HumanMessage("Hi")                HumanMessage("Hi"),
  ]                                   AIMessage("Hello! How can I help?")
}                                   ]
                                  }
```

---

### Lines 38-44: Tools Router Node

```python
async def tools_router(state: State):
    last_message = state["messages"][-1]

    if(hasattr(last_message, "tool_calls") and len(last_message.tool_calls) > 0):
        return "tool_node"
    else: 
        return END
```

**What it does**:
- **Line 39**: Gets the most recent message (the AI's response)
- **Line 41**: Checks if the AI wants to use a tool
  - `hasattr(last_message, "tool_calls")`: Does the message have a tool_calls attribute?
  - `len(last_message.tool_calls) > 0`: Are there any tool calls?
- **Line 42**: If yes, route to `tool_node`
- **Line 44**: If no, conversation is complete, return `END`

**Decision Flow**:
```
                ┌─────────────────┐
                │  Last Message   │
                │  from Model     │
                └────────┬────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │ Does it have tool_calls?      │
         └───────────┬───────────────────┘
                     │
           ┌─────────┴─────────┐
           │                   │
          YES                 NO
           │                   │
           ▼                   ▼
    ┌─────────────┐     ┌──────────┐
    │  tool_node  │     │   END    │
    └─────────────┘     └──────────┘
```

---

### Lines 46-75: Tool Node

```python
async def tool_node(state):
    """Custom tool node that handles tool calls from the LLM."""
    # Get the tool calls from the last message
    tool_calls = state["messages"][-1].tool_calls
    
    # Initialize list to store tool messages
    tool_messages = []
    
    # Process each tool call
    for tool_call in tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        tool_id = tool_call["id"]
        
        # Handle the search tool
        if tool_name == "tavily_search_results_json":
            # Execute the search tool with the provided arguments
            search_results = await search_tool.ainvoke(tool_args)
            
            # Create a ToolMessage for this result
            tool_message = ToolMessage(
                content=str(search_results),
                tool_call_id=tool_id,
                name=tool_name
            )
            
            tool_messages.append(tool_message)
    
    # Add the tool messages to the state
    return {"messages": tool_messages}
```

**Line-by-Line Breakdown**:

- **Line 49**: Extract tool calls from the last AI message
- **Line 52**: Create empty list to collect results
- **Line 55**: Loop through each tool call (could be multiple)
- **Lines 56-58**: Extract tool details
  - `tool_name`: Which tool to use (e.g., "tavily_search_results_json")
  - `tool_args`: Arguments for the tool (e.g., `{"query": "weather Delhi"}`)
  - `tool_id`: Unique ID to match request with response
- **Line 61**: Check if it's the search tool
- **Line 63**: Execute the search asynchronously
- **Lines 66-70**: Create a ToolMessage with the results
- **Line 72**: Add to our list of tool messages
- **Line 75**: Return all tool results

**Execution Example**:
```
Input Tool Call:
{
    "name": "tavily_search_results_json",
    "args": {"query": "weather in Delhi"},
    "id": "call_abc123"
}
         ↓
Execute Search
         ↓
Output ToolMessage:
{
    "content": "[{'url': 'weather.com', 'title': '...', ...}]",
    "tool_call_id": "call_abc123",
    "name": "tavily_search_results_json"
}
```

---

### Lines 77-86: Build the Agent Graph

```python
graph_builder = StateGraph(State)

graph_builder.add_node("model", model)
graph_builder.add_node("tool_node", tool_node)
graph_builder.set_entry_point("model")

graph_builder.add_conditional_edges("model", tools_router)
graph_builder.add_edge("tool_node", "model")

graph = graph_builder.compile(checkpointer=memory)
```

**What's happening**:

- **Line 77**: Initialize a graph builder with our State schema
- **Lines 79-80**: Add nodes (think of them as stations in a workflow)
- **Line 81**: Set "model" as the starting point
- **Line 83**: Add conditional routing from "model" (the router decides where to go)
- **Line 84**: After tool execution, always go back to "model"
- **Line 86**: Compile the graph with memory checkpointing enabled

**Graph Visualization**:
```
                  ┌──────────────┐
                  │   START      │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
             ┌───▶│    model     │────┐
             │    └──────┬───────┘    │
             │           │            │
             │           ▼            │
             │    ┌─────────────┐    │
             │    │   router    │    │
             │    └──────┬──────┘    │
             │           │            │
             │      ┌────┴────┐      │
             │      │         │      │
             │     YES       NO      │
             │      │         │      │
             │      ▼         ▼      │
             │  ┌─────────┐ ┌─────┐ │
             └──│tool_node│ │ END │◀┘
                └─────────┘ └─────┘
```

---

## FastAPI Setup

### Lines 88-98: Initialize FastAPI and CORS

```python
app = FastAPI()

# Add CORS middleware with settings that match frontend requirements
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"], 
    expose_headers=["Content-Type"], 
)
```

**Line-by-Line**:

- **Line 88**: Create a FastAPI application instance
- **Lines 91-98**: Configure CORS (Cross-Origin Resource Sharing)
  - **`allow_origins=["*"]`**: Allow requests from any domain (use specific domains in production)
  - **`allow_credentials=True`**: Allow cookies and authentication
  - **`allow_methods=["*"]`**: Allow all HTTP methods (GET, POST, etc.)
  - **`allow_headers=["*"]`**: Allow all headers
  - **`expose_headers=["Content-Type"]`**: Make Content-Type header visible to client

**Why CORS is needed**:
```
Without CORS:
Browser (localhost:3000) ──X──> Server (localhost:8000)
                        Blocked!

With CORS:
Browser (localhost:3000) ──✓──> Server (localhost:8000)
                         Allowed!
```

---

### Lines 100-106: Serialization Helper Function

```python
def serialise_ai_message_chunk(chunk): 
    if(isinstance(chunk, AIMessageChunk)):
        return chunk.content
    else:
        raise TypeError(
            f"Object of type {type(chunk).__name__} is not correctly formatted for serialisation"
        )
```

**What it does**:
- **Line 101**: Checks if the chunk is an `AIMessageChunk`
- **Line 102**: If yes, extract and return the content (the actual text)
- **Lines 104-106**: If no, raise an error with helpful message

**Example**:
```python
# Input
chunk = AIMessageChunk(content="Hello", type="ai")

# Output
"Hello"
```

**Why we need it**: The streaming events contain complex objects. We only want the text content to send to the client.

---

## Server-Sent Events (SSE)

### What are Server-Sent Events?

Server-Sent Events (SSE) is a technology that allows a server to push updates to the client over HTTP.

**SSE vs WebSockets**:

```
WebSockets (Bidirectional):
Client ←──────────────→ Server
       Send & Receive

Server-Sent Events (Unidirectional):
Client ←────────────── Server
       Receive Only
```

**When to use SSE**:
- Real-time updates (stock prices, news feeds)
- Streaming AI responses (our use case)
- Live notifications

**When to use WebSockets**:
- Chat applications (both sides sending messages)
- Multiplayer games
- Collaborative editing

### SSE Protocol Format

SSE messages must follow this format:
```
data: <your JSON data here>\n\n
```

**Key rules**:
1. Must start with `data: `
2. Must end with `\n\n` (two newlines)
3. Each event is separated by `\n\n`

**Example**:
```
data: {"type": "content", "content": "Hello"}\n\n
data: {"type": "content", "content": " world"}\n\n
data: {"type": "end"}\n\n
```

---

## Streaming Implementation

### Lines 108-141: Generator Function Setup

```python
async def generate_chat_responses(message: str, checkpoint_id: Optional[str] = None):
    is_new_conversation = checkpoint_id is None
    
    if is_new_conversation:
        # Generate new checkpoint ID for first message in conversation
        new_checkpoint_id = str(uuid4())

        config = {
            "configurable": {
                "thread_id": new_checkpoint_id
            }
        }
        
        # Initialize with first message
        events = graph.astream_events(
            {"messages": [HumanMessage(content=message)]},
            version="v2",
            config=config
        )
        
        # First send the checkpoint ID
        yield f"data: {{\"type\": \"checkpoint\", \"checkpoint_id\": \"{new_checkpoint_id}\"}}\n\n"
    else:
        config = {
            "configurable": {
                "thread_id": checkpoint_id
            }
        }
        # Continue existing conversation
        events = graph.astream_events(
            {"messages": [HumanMessage(content=message)]},
            version="v2",
            config=config
        )
```

**Detailed Explanation**:

#### Line 108: Function Signature
```python
async def generate_chat_responses(message: str, checkpoint_id: Optional[str] = None):
```
- **`async def`**: Asynchronous generator function
- **`message`**: The user's input text
- **`checkpoint_id`**: Optional thread ID for continuing conversations

#### Line 109: Determine Conversation Type
```python
is_new_conversation = checkpoint_id is None
```
- If `checkpoint_id` is `None`, it's a new conversation
- If provided, we're continuing an existing conversation

#### Lines 111-129: New Conversation Flow

**Line 113**: Generate a unique ID
```python
new_checkpoint_id = str(uuid4())
```
Example output: `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`

**Lines 115-119**: Create configuration
```python
config = {
    "configurable": {
        "thread_id": new_checkpoint_id
    }
}
```
This tells LangGraph which conversation thread this message belongs to.

**Lines 122-126**: Start streaming events
```python
events = graph.astream_events(
    {"messages": [HumanMessage(content=message)]},
    version="v2",
    config=config
)
```
- `astream_events`: Streams all events from the graph execution
- `version="v2"`: Use version 2 of the streaming API
- Returns an async iterator of events

**Line 129**: Send checkpoint to client
```python
yield f"data: {{\"type\": \"checkpoint\", \"checkpoint_id\": \"{new_checkpoint_id}\"}}\n\n"
```
- **`yield`**: Generator keyword that emits a value
- Sends the checkpoint ID so client can use it for future messages
- Must follow SSE format: `data: {...}\n\n`
- Double braces `{{` and `}}` escape the braces in f-strings

**Output**:
```
data: {"type": "checkpoint", "checkpoint_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"}\n\n
```

#### Lines 130-141: Existing Conversation Flow

Same as above but:
- Uses the provided `checkpoint_id` instead of generating a new one
- Doesn't send the checkpoint to the client (they already have it)

**Conversation Flow Diagram**:
```
First Message:
User ──("Hello")──> Server
                    │
                    ├─ Generate checkpoint_id: "abc123"
                    ├─ Send checkpoint_id to client
                    └─ Start agent graph with thread_id="abc123"

Second Message:
User ──("How are you?", checkpoint_id="abc123")──> Server
                                                   │
                                                   └─ Continue graph with thread_id="abc123"
                                                      (Memory restored automatically)
```

---

### Lines 143-151: Streaming Content Events

```python
    async for event in events:
        event_type = event["event"]
        
        if event_type == "on_chat_model_stream":
            chunk_content = serialise_ai_message_chunk(event["data"]["chunk"])
            # Escape single quotes and newlines for safe JSON parsing
            safe_content = chunk_content.replace("'", "\\'").replace("\n", "\\n")
            
            yield f"data: {{\"type\": \"content\", \"content\": \"{safe_content}\"}}\n\n"
```

**Line-by-Line**:

#### Line 143: Iterate Through Events
```python
async for event in events:
```
- Loop through each event emitted by the graph
- `async for`: Waits for each event asynchronously

#### Line 144: Get Event Type
```python
event_type = event["event"]
```
Events have different types:
- `on_chat_model_stream`: AI is generating text (token by token)
- `on_chat_model_end`: AI finished generating
- `on_tool_start`: Tool execution starting
- `on_tool_end`: Tool execution complete

#### Lines 146-151: Handle Streaming Content

**Line 146**: Check if this is a streaming token
```python
if event_type == "on_chat_model_stream":
```

**Line 147**: Extract the content
```python
chunk_content = serialise_ai_message_chunk(event["data"]["chunk"])
```
Event structure:
```python
{
    "event": "on_chat_model_stream",
    "data": {
        "chunk": AIMessageChunk(content="The", type="ai")
    }
}
```
After serialization: `"The"`

**Line 149**: Escape special characters
```python
safe_content = chunk_content.replace("'", "\\'").replace("\n", "\\n")
```
- **Why?** To prevent breaking JSON format
- `'` → `\'` (escape single quotes)
- `\n` → `\\n` (escape newlines)

Example:
```python
# Before
"It's a\nnice day"

# After
"It\\'s a\\nnice day"
```

**Line 151**: Send to client
```python
yield f"data: {{\"type\": \"content\", \"content\": \"{safe_content}\"}}\n\n"
```

**Streaming Visualization**:
```
AI Response: "The weather is sunny"

Events emitted:
1. data: {"type": "content", "content": "The"}\n\n
2. data: {"type": "content", "content": " weather"}\n\n
3. data: {"type": "content", "content": " is"}\n\n
4. data: {"type": "content", "content": " sunny"}\n\n

Client sees it appear word by word!
```

---

### Lines 153-163: Handle Tool Calls

```python
        elif event_type == "on_chat_model_end":
            # Check if there are tool calls for search
            tool_calls = event["data"]["output"].tool_calls if hasattr(event["data"]["output"], "tool_calls") else []
            search_calls = [call for call in tool_calls if call["name"] == "tavily_search_results_json"]
            
            if search_calls:
                # Signal that a search is starting
                search_query = search_calls[0]["args"].get("query", "")
                # Escape quotes and special characters
                safe_query = search_query.replace('"', '\\"').replace("'", "\\'").replace("\n", "\\n")
                yield f"data: {{\"type\": \"search_start\", \"query\": \"{safe_query}\"}}\n\n"
```

**What's happening**:

#### Line 153: Detect End of AI Generation
```python
elif event_type == "on_chat_model_end":
```
This fires when the AI has finished generating its response.

#### Line 155: Extract Tool Calls
```python
tool_calls = event["data"]["output"].tool_calls if hasattr(event["data"]["output"], "tool_calls") else []
```
- Check if the output has `tool_calls` attribute
- If yes, get the list; if no, use empty list
- **Why?** Not all responses have tool calls (only when AI needs to use a tool)

#### Line 156: Filter for Search Calls
```python
search_calls = [call for call in tool_calls if call["name"] == "tavily_search_results_json"]
```
- List comprehension to find only Tavily search calls
- Filters out other potential tool calls

**Tool Call Structure**:
```python
{
    "name": "tavily_search_results_json",
    "args": {"query": "weather in Delhi"},
    "id": "call_xyz789"
}
```

#### Lines 158-163: Notify Client About Search

**Line 160**: Extract search query
```python
search_query = search_calls[0]["args"].get("query", "")
```

**Line 162**: Escape special characters
```python
safe_query = search_query.replace('"', '\\"').replace("'", "\\'").replace("\n", "\\n")
```

**Line 163**: Send search start event
```python
yield f"data: {{\"type\": \"search_start\", \"query\": \"{safe_query}\"}}\n\n"
```

**Why send this?** So the UI can show:
```
🔍 Searching the web for: "weather in Delhi"
```

**Event Flow Diagram**:
```
User: "What's the weather in Delhi?"
         ↓
    [on_chat_model_stream events - empty content]
         ↓
    [on_chat_model_end event with tool_call]
         ↓
    Send: {"type": "search_start", "query": "weather in Delhi"}
         ↓
    UI shows: 🔍 Searching...
```

---

### Lines 165-179: Handle Search Results

```python
        elif event_type == "on_tool_end" and event["name"] == "tavily_search_results_json":
            # Search completed - send results or error
            output = event["data"]["output"]
            
            # Check if output is a list 
            if isinstance(output, list):
                # Extract URLs from list of search results
                urls = []
                for item in output:
                    if isinstance(item, dict) and "url" in item:
                        urls.append(item["url"])
                
                # Convert URLs to JSON and yield them
                urls_json = json.dumps(urls)
                yield f"data: {{\"type\": \"search_results\", \"urls\": {urls_json}}}\n\n"
```

**Line-by-Line Explanation**:

#### Line 165: Detect Tool Completion
```python
elif event_type == "on_tool_end" and event["name"] == "tavily_search_results_json":
```
- Fires when the Tavily search tool finishes
- Double check it's the right tool with `event["name"]`

#### Line 167: Get Tool Output
```python
output = event["data"]["output"]
```

**Output Format** (from Tavily):
```python
[
    {
        "url": "https://weather.com/delhi",
        "title": "Delhi Weather - Current Conditions",
        "content": "The weather in Delhi is currently...",
        "score": 0.98
    },
    {
        "url": "https://accuweather.com/delhi",
        "title": "Delhi Weather Forecast",
        "content": "Today's forecast shows...",
        "score": 0.95
    },
    ...
]
```

#### Lines 170-175: Extract URLs
```python
if isinstance(output, list):
    urls = []
    for item in output:
        if isinstance(item, dict) and "url" in item:
            urls.append(item["url"])
```
- Verify output is a list
- Loop through each search result
- Check if it's a dictionary with a "url" key
- Collect all URLs

**After extraction**:
```python
urls = [
    "https://weather.com/delhi",
    "https://accuweather.com/delhi",
    ...
]
```

#### Lines 177-178: Send URLs to Client
```python
urls_json = json.dumps(urls)
yield f"data: {{\"type\": \"search_results\", \"urls\": {urls_json}}}\n\n"
```

**Output**:
```
data: {"type": "search_results", "urls": ["https://weather.com/delhi", "https://accuweather.com/delhi"]}\n\n
```

**Why send URLs?** The UI can display:
```
📚 Sources:
  • weather.com/delhi
  • accuweather.com/delhi
```

---

### Lines 181-182: End Event

```python
    # Send an end event
    yield f"data: {{\"type\": \"end\"}}\n\n"
```

**What it does**:
- Signals that the stream is complete
- Client knows to stop listening for events
- Can display "✓ Complete" or similar indicator

---

### Lines 184-189: FastAPI Endpoint

```python
@app.get("/chat_stream/{message}")
async def chat_stream(message: str, checkpoint_id: Optional[str] = Query(None)):
    return StreamingResponse(
        generate_chat_responses(message, checkpoint_id), 
        media_type="text/event-stream"
    )
```

**Line-by-Line**:

#### Line 184: Route Definition
```python
@app.get("/chat_stream/{message}")
```
- **`@app.get`**: Handle GET requests
- **`{message}`**: Path parameter - captures user message from URL

**Example URL**:
```
http://localhost:8000/chat_stream/Hello?checkpoint_id=abc123
                                   ^^^^^^^                ^^^^^^^^^
                              path parameter        query parameter
```

#### Line 185: Function Signature
```python
async def chat_stream(message: str, checkpoint_id: Optional[str] = Query(None)):
```
- **`message: str`**: Extracted from URL path
- **`checkpoint_id: Optional[str] = Query(None)`**: Optional query parameter
  - `Query(None)`: Marks it as a query parameter with default value `None`

#### Lines 186-189: Return Streaming Response
```python
return StreamingResponse(
    generate_chat_responses(message, checkpoint_id), 
    media_type="text/event-stream"
)
```

**Components**:
1. **`StreamingResponse`**: FastAPI class for streaming data
2. **First argument**: Our generator function (produces events)
3. **`media_type="text/event-stream"`**: Required for SSE protocol

**How it works**:
```
Client sends request
        ↓
FastAPI calls chat_stream()
        ↓
Returns StreamingResponse with generator
        ↓
Generator yields events one by one
        ↓
FastAPI sends each event immediately to client
        ↓
Stream closes when generator completes
```

---

## Complete Event Flow Example

Let's trace a complete request: **"What's the weather in Delhi?"**

### 1. Client Request
```
GET /chat_stream/What's%20the%20weather%20in%20Delhi?checkpoint_id=null
```

### 2. Server Processing

```
Step 1: Generate checkpoint ID
   ↓
Send: data: {"type": "checkpoint", "checkpoint_id": "abc-123"}\n\n

Step 2: LangGraph starts processing
   ↓
Model Node: AI analyzes the question
   ↓
Send: data: {"type": "content", "content": ""}\n\n (empty because it needs a tool)

Step 3: Router decides to use tool
   ↓
Send: data: {"type": "search_start", "query": "current weather Delhi"}\n\n

Step 4: Tool Node executes search
   ↓
Tavily searches the web...
   ↓
Send: data: {"type": "search_results", "urls": ["https://...", ...]}\n\n

Step 5: Tool results go back to Model
   ↓
Model generates final response
   ↓
Send: data: {"type": "content", "content": "The"}\n\n
Send: data: {"type": "content", "content": " current"}\n\n
Send: data: {"type": "content", "content": " weather"}\n\n
Send: data: {"type": "content", "content": " in"}\n\n
Send: data: {"type": "content", "content": " Delhi"}\n\n
Send: data: {"type": "content", "content": " is"}\n\n
Send: data: {"type": "content", "content": " sunny"}\n\n
Send: data: {"type": "content", "content": " with"}\n\n
Send: data: {"type": "content", "content": " a"}\n\n
Send: data: {"type": "content", "content": " temperature"}\n\n
Send: data: {"type": "content", "content": " of"}\n\n
Send: data: {"type": "content", "content": " 28°C"}\n\n

Step 6: Stream ends
   ↓
Send: data: {"type": "end"}\n\n
```

### 3. Client Receives

The browser receives these events in real-time and updates the UI progressively:

```
[Checkpoint received: abc-123]

🔍 Searching the web for: current weather Delhi

📚 Sources:
  • weather.com/delhi
  • accuweather.com/delhi

AI: The current weather in Delhi is sunny with a temperature of 28°C

✓ Complete
```

---

## Running the Application

### Prerequisites
```bash
# Install dependencies
pip install fastapi uvicorn langchain langchain-openai langgraph tavily-python python-dotenv

# Create .env file
OPENAI_API_KEY=your_openai_key_here
TAVILY_API_KEY=your_tavily_key_here
```

### Start the Server
```bash
uvicorn app:app --reload
```

**Command breakdown**:
- **`uvicorn`**: ASGI server (like Gunicorn for async Python)
- **`app`**: Python file name (app.py)
- **`:app`**: Variable name of FastAPI instance
- **`--reload`**: Auto-restart on code changes

### Test with Swagger UI

1. Open browser: `http://localhost:8000/docs`
2. Click on `/chat_stream/{message}`
3. Click "Try it out"
4. Enter a message
5. (Optional) Enter checkpoint_id
6. Click "Execute"
7. See streaming events in real-time!

### Test with cURL
```bash
curl -N http://localhost:8000/chat_stream/Hello

# Output:
# data: {"type": "checkpoint", "checkpoint_id": "..."}
#
# data: {"type": "content", "content": "Hello"}
#
# data: {"type": "content", "content": "!"}
#
# data: {"type": "content", "content": " How"}
#
# ...
```

**`-N` flag**: Disables buffering so you see events immediately

---

## Key Concepts Summary

### 1. Async/Await
- **Why**: Handle multiple users simultaneously without blocking
- **Example**: While waiting for OpenAI API, server can handle other requests

### 2. Generator Functions (yield)
- **Why**: Emit values one at a time instead of all at once
- **Example**: Stream tokens as they're generated instead of waiting for complete response

### 3. Server-Sent Events
- **Why**: Push real-time updates from server to client
- **Format**: `data: <JSON>\n\n`

### 4. LangGraph
- **Why**: Build complex agent workflows with memory and tools
- **Components**: State, Nodes, Edges, Checkpointing

### 5. Streaming Responses
- **Why**: Better UX - users see responses immediately
- **How**: FastAPI's `StreamingResponse` + generator function

---

## Common Patterns Explained

### Pattern 1: Safe JSON in Strings
```python
# Problem: Nested quotes break JSON
yield f"data: {"message": "Hello's world"}\n\n"  # ❌ Broken

# Solution: Escape quotes
safe_msg = "Hello's world".replace("'", "\\'")
yield f"data: {{\"message\": \"{safe_msg}\"}}\n\n"  # ✅ Works
```

### Pattern 2: Optional Parameters
```python
def function(required: str, optional: Optional[str] = None):
    if optional is None:
        # Handle case without optional parameter
    else:
        # Handle case with optional parameter
```

### Pattern 3: Event-Driven Processing
```python
async for event in events:
    event_type = event["event"]
    
    if event_type == "type1":
        # Handle type 1
    elif event_type == "type2":
        # Handle type 2
    elif event_type == "type3":
        # Handle type 3
```

---

## Debugging Tips

### 1. Check SSE Format
Ensure every event has:
```python
yield f"data: <JSON>\n\n"
       ^     ^    ^  ^
       |     |    |  |
    required |  required
          JSON  double newline
```

### 2. Inspect Events
Add logging to see what events are emitted:
```python
async for event in events:
    print(f"Event: {event}")  # Debug print
    event_type = event["event"]
    # ...
```

### 3. Test Endpoints
Use Swagger UI at `http://localhost:8000/docs` for interactive testing

### 4. Monitor Network
Open browser DevTools → Network → Find request → See SSE events in real-time

---

## Extension Ideas

### 1. Add More Tools
```python
from langchain.tools import WikipediaQueryRun

wiki_tool = WikipediaQueryRun()
tools = [search_tool, wiki_tool]
```

### 2. Add Authentication
```python
from fastapi import Header

async def chat_stream(
    message: str, 
    checkpoint_id: Optional[str] = Query(None),
    api_key: str = Header(None)
):
    if api_key != "secret123":
        raise HTTPException(401, "Invalid API key")
    # ...
```

### 3. Add Database Persistence
```python
from langgraph.checkpoint.postgres import PostgresSaver

memory = PostgresSaver(connection_string="postgresql://...")
```

### 4. Add Rate Limiting
```python
from slowapi import Limiter

limiter = Limiter(key_func=lambda: "global")

@app.get("/chat_stream/{message}")
@limiter.limit("5/minute")
async def chat_stream(...):
    # ...
```

---

## Troubleshooting

### Issue: "No module named 'langchain'"
**Solution**: Install dependencies
```bash
pip install langchain langchain-openai langgraph
```

### Issue: "OpenAI API key not found"
**Solution**: Create `.env` file with:
```
OPENAI_API_KEY=sk-...
```

### Issue: Events not streaming
**Solution**: Check media type is set correctly:
```python
return StreamingResponse(..., media_type="text/event-stream")
```

### Issue: CORS errors in browser
**Solution**: Verify CORS middleware is configured:
```python
app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)
```

---

## Conclusion

This implementation combines several advanced concepts:
- ✅ FastAPI for web server
- ✅ LangGraph for AI agent workflows
- ✅ Server-Sent Events for real-time streaming
- ✅ Async/await for concurrent handling
- ✅ Memory checkpointing for conversation context

The result is a production-ready, scalable AI chatbot API that streams responses in real-time, uses tools when needed, and maintains conversation history.

Happy coding! 🚀

