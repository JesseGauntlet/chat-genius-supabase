# Real-Time Chat Application Requirements

A **Slack-like** real-time chat application leveraging **Supabase** for authentication, database, file storage, and real-time messaging. A **Python** backend will be included to facilitate advanced features such as AI chatbot integration in the future. Below are the key requirements, the proposed database schema (in list format), the tech stack details, and API endpoints.

---

## 1. Overview

This application features multiple workspaces, channels (public and private), thread-based conversations, file sharing, user presence, emoji reactions, and search capabilities. By leveraging **Supabase** for core backend features, we can rapidly prototype real-time messaging, authentication, and storage. Supabase will be run locally in a docker container during development, and deployed to the cloud during production. A Python backend will supplement these services for specialized functionality (e.g., AI-driven features).

---

## 2. Functional Requirements

1. **Authentication & Authorization**
   - Use **Supabase** Auth for user registration, login, and Single Sign-On (SSO) with Google.
   - Secure session management with JWT or Supabase's session-based tokens.

2. **Workspaces & Channels**
   - Multiple workspaces per user.
   - Each workspace can have multiple channels (public, private, or shared across workspaces).
   - Users are invited or assigned to channels via membership records.

3. **Real-Time Messaging**
   - Real-time chat powered by **Supabase Realtime**.
   - Threaded replies, direct messages (DMs), and channel-based conversations.
   - Typing indicators and presence updates (e.g., online, offline, away).

4. **Search**
   - Powered by an external or internal search engine (could integrate with Supabase PG text search or an external service).
   - Messages and channels can be searched by keywords, user mentions, or timestamps.

5. **File Sharing**
   - Use **Supabase Storage** for uploads and downloads within channels or DMs.
   - Support for images, documents, etc.

6. **User Presence & Status**
   - Real-time presence indicators (online, offline, away).
   - Custom status messages (e.g., “In a meeting”).

7. **Emoji Reactions**
   - Emoji reactions on messages (tracked in a dedicated table).

8. **Future AI Integrations (Python Backend)**
   - A separate Python service or functions could integrate with the Supabase database to provide AI-driven features (e.g., automated response suggestions, summarization).

---

## 3. Non-Functional Requirements

1. **Scalability**
   - Supabase services scale horizontally as usage grows.
   - Python backend can scale separately (containerized or serverless).

2. **Performance**
   - Low-latency real-time updates via Supabase’s Realtime engine.
   - Efficient search (Supabase Postgres full-text search or external search service).

3. **Security**
   - SSL for data in transit.
   - Role-based access control for channels and workspace administration.
   - Proper data partitioning for shared channels across workspaces.

4. **Reliability**
   - Use Supabase’s managed Postgres for high availability.
   - Off-site backups and automated failover policies where applicable.

5. **Maintainability**
   - Mono-repo structure for both Next.js frontend and Python backend code.
   - Clear separation of responsibilities between the Supabase services and custom Python functionalities.

---

## 4. Database Schema (Supabase)

Below is a high-level outline of the tables (entities) needed to fulfill the requirements. Supabase Postgres will be used for storage, and Supabase Realtime will provide the live event streams.

### **1. `users`**
- **id (PK)**  
- **name**  
- **email**  
- **created_at**  
- **last_login**

### **2. `members`**
- **id (PK)**  
- **user_id (FK)** → `users.id`  
- **channel_id (FK)** → `channels.id`  
- **created_at**

### **3. `channels`**
- **id (PK)**  
- **name**  
- **description**  
- **created_at**  
- **is_private** (boolean)

### **4. `workspaces`**
- **id (PK)**  
- **name**  
- **channel_id (FK)** → (the default channel for this workspace)  
- **created_at**

### **5. `shared_channels`**
- **channel_id (FK)** → `channels.id`  
- **workspace_id (FK)** → `workspaces.id`  
- **target_workspace_id (FK)** → `workspaces.id`  
- **origin_workspace_id (FK)** → `workspaces.id`  
- **name**  
- **topic**  
- **is_private**

### **6. `chat`**
- **id (PK)**  
- **user_id (FK)** → `users.id`  
- **channel_id (FK)** → `channels.id`  
- **message (JSONB)**  (e.g., `{ text: "...", attachments: ["..."] }`)  
- **total_replies**  
- **is_deleted** (boolean)  
- **modified_at**  
- **created_at**  
- **parent_id** (for threaded messages referencing another `chat.id`)

### **7. `emojis`**
- **id (PK)**  
- **user_id (FK)** → `users.id`  
- **chat_id (FK)** → `chat.id`  
- **emoji_uni_code** (string representing the emoji)

---

## 5. Tech Stack

### 5.1 Frontend
- **Framework**: [Next.js (React)](https://nextjs.org/)  
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)  
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (or similar)  
- **Real-time**: [Supabase Realtime](https://supabase.com/docs/guides/realtime)  
- **Authentication**: [Supabase Auth](https://supabase.com/docs/guides/auth)

### 5.2 Backend
- **Primary**: **Supabase** (Postgres, Auth, Storage, Realtime)  
- **Supplemental**: **Python** (FastAPI or similar) for advanced features  
  - Can be run as a separate service or serverless functions  
  - Integrate AI-based functionalities (text generation, summarization, etc.)

### 5.3 Deployment & Containerization
- **Docker & Docker Compose** for local development of the Python service alongside the Next.js app.  
- **Supabase** handles managed Postgres, Realtime, Auth, and Storage in the cloud.

---

## 6. API Endpoints

Even though Supabase can handle much of the CRUD logic via its **REST** and **Realtime** APIs, we outline additional endpoints (especially for the Python backend) that might be needed for advanced scenarios. These endpoints can coexist with Supabase’s auto-generated APIs.

> **Note**: For basic CRUD (create, read, update, delete) on `users`, `channels`, `chat`, etc., Supabase’s auto-generated REST endpoints might suffice. The endpoints below focus on custom logic or expansions.

### 6.1 Authentication Endpoints (Supabase Auth)

- **/auth/signup** (Handled by Supabase Auth UI or client libraries)
- **/auth/login** (Handled by Supabase Auth UI or client libraries)
- **/auth/logout** (Handled by Supabase Auth UI or client libraries)
- **/auth/social** (Google, etc.)

### 6.2 Python Backend Endpoints

Below are some custom API endpoints if we use a Python (FastAPI) service in parallel with Supabase:

#### **POST /api/chat/generate-response**
- **Purpose**: Example of an AI-driven endpoint for message auto-replies or summarizations.
- **Request**:
  ```json
  {
    "channel_id": "C123",
    "user_id": "U456",
    "last_message": "What are we working on today?"
  }
Response:
{
  "ai_response": "Today we’re focusing on the new design prototypes."
}
GET /api/users/{user_id}/profile
Purpose: Fetch augmented user profile (with data from both Supabase and external AI or analytics).
Response:
{
  "id": "U123",
  "name": "John Doe",
  "roles": ["workspace_admin", "channel_moderator"],
  "stats": {
    "messages_sent": 1234,
    "channels_joined": 10
  }
}
Any Additional Endpoints
We can create further endpoints for AI-based channel summarization, advanced search, or analytics, which leverage data from Supabase.
7. Example Supabase-driven Endpoints
Below are examples of how we might leverage Supabase’s auto-generated APIs:

POST /rest/v1/chat
Inserts a new message row into the chat table.
GET /rest/v1/chat?channel_id=eq.C123
Retrieves all messages for channel C123.
Can use query params (e.g., pagination, order) for advanced filtering.
PATCH /rest/v1/chat?id=eq.M999
Updates an existing message row (modified_at, message JSONB).
DELETE /rest/v1/chat?id=eq.M999
Soft delete or remove a message.
For real-time changes, the frontend can subscribe to Supabase Realtime channels for live updates.

8. Suggested Mono-Repo Structure
Even with Supabase handling much of the backend, maintaining a mono-repo can streamline collaboration:

chat-genius-supabase/
├── apps/
│   ├── frontend/
│   │   ├── package.json
│   │   ├── next.config.js
│   │   ├── pages/
│   │   ├── components/
│   │   ├── styles/
│   │   └── ...
│   └── python-backend/
│       ├── app/
│       │   ├── main.py          # FastAPI entry point
│       │   ├── requirements.txt
│       │   ├── Dockerfile
│       │   └── ...
├── packages/                    # optional for shared code
├── .env                         # environment variables for local dev
├── docker/
│   ├── docker-compose.yml       # orchestrate python-backend + front-end
│   └── ...
└── README.md

frontend: Next.js app that interacts directly with Supabase (Auth, Storage, Realtime, etc.).
python-backend: Optional service for AI or other advanced features.
Supabase: Hosted in the cloud (database, auth, storage, realtime). You might also run Supabase locally via Docker if desired.

9. Implementation & Deployment Notes
Supabase Setup

Create a new project at app.supabase.com
Configure Auth (Google OAuth, email/password).
Define the tables (users, channels, chat, etc.) with corresponding columns.
Enable Realtime on the relevant tables (e.g., chat).
AI Integration

The Python backend can connect to the Supabase database via the Supabase Python client or direct Postgres connection.
Integrate AI platforms like OpenAI GPT or local LLMs for advanced features.
Search

For basic searching, leverage Postgres Full-Text Search in Supabase.
For advanced searching, consider bridging to an external search engine (like Elasticsearch) or fully leveraging Postgres indexes.
File Storage

Use Supabase Storage for images, attachments.
Handle large file uploads via signed URLs.
Local Development

Use supabase start (if you want to run Supabase locally) or rely on the hosted instance.
docker-compose.yml for spinning up the Python service and Next.js in containers.
CI/CD

Automated testing, linting, and deployments for the Next.js frontend and Python backend.
Supabase migrations for database schema changes (supabase db push or manual SQL migrations).
