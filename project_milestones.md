# Project Milestones & Checklist

## 1. Project Setup
- [x] Create a new mono-repo for the project
- [x] Set up the Next.js frontend app
  - [x] Configure Tailwind CSS
  - [x] Choose and set up a component library (e.g., shadcn/ui)
- [x] Set up the Python backend (FastAPI)
  - [x] Create a Dockerfile for containerization
- [x] Configure docker-compose for local development
- [x] Set up environment variables for local development

## 2. Supabase Setup
- [x] Create a new Supabase project
- [x] Set up authentication
  - [x] Configure Google OAuth
  - [x] Set up email/password authentication
- [x] Create the database schema
  - [x] `users` table
  - [x] `members` table
  - [x] `channels` table
  - [x] `workspaces` table
  - [x] `shared_channels` table
  - [x] `chat` table
  - [x] `emojis` table
- [x] Enable Realtime on relevant tables (e.g., `chat`)

## 3. Authentication & Authorization
- [x] Implement user registration and login flows using Supabase Auth
- [x] Set up secure session management (JWT or Supabase's session-based tokens)
- [x] Implement role-based access control for channels and workspace administration

## 4. Workspaces & Channels
- [x] Implement workspace creation and management
- [x] Implement channel creation within workspaces

## 5. Real-Time Messaging
- [x] Implement real-time chat using Supabase Realtime
  - [x] Channel-based conversations
  - [x] Direct messages (DMs)
  - [x] Threaded replies

## 6. Search
- [x] Implement basic search using Postgres Full-Text Search in Supabase (*Using RAG for more advanced search, no default basic seaerch)

## 7. File Sharing
- [x] Set up Supabase Storage for file uploads and downloads
- [x] Implement file sharing within channels and DMs

## 8. User Presence & Status
- [x] Implement real-time presence indicators (online, offline, away) *TODO: Indicator currently manually set only
- [x] Allow users to set custom status messages
- [ ] Implement typing indicators

## 9. Emoji Reactions
- [x] Implement emoji reactions on messages
- [x] Store emoji reactions in the `emojis` table

## 10. AI Integrations (Python Backend)
- [ ] Set up the Python backend to connect to the Supabase database
- [ ] Integrate AI platforms (e.g., OpenAI GPT) for advanced features
  - [ ] Automated response suggestions
  - [ ] Message summarization
- [ ] Expose AI functionalities through API endpoints

## 11. Testing & Quality Assurance
- [ ] Write unit tests for critical components
- [ ] Perform end-to-end testing of key user flows
- [ ] Conduct performance testing and optimize as needed
- [ ] Perform security audits and address any vulnerabilities

## 12. Deployment
- [ ] Set up CI/CD pipelines for the Next.js frontend and Python backend
- [ ] Configure Supabase migrations for database schema changes
- [ ] Deploy the Next.js frontend to a hosting platform (e.g., Vercel)
- [ ] Deploy the Python backend (containerized or serverless)
- [ ] Configure SSL for data in transit
- [ ] Set up off-site backups and automated failover policies

## 13. Documentation & Handoff
- [ ] Create user documentation and guides
- [ ] Write technical documentation for future maintainers
- [ ] Perform knowledge transfer sessions with the team
- [ ] Set up monitoring and alerting for production issues 