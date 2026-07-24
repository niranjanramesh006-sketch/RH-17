# 🚀 UniAssist AI

<p align="center">
  <h3 align="center">An Intelligent AI-Powered Multi-Tenant Assistant Platform</h3>
  <p align="center">
    Empowering organizations with AI-driven document intelligence, smart conversations, and workflow automation.
  </p>
</p>

---

## 👨‍💻 Team Members

| Name | Role |
|------|------|
| Niranjan R | Full Stack Developer |
| Shreejan V | AI & Backend Developer |
| Vyas D | Frontend Developer |
| Selison A | Database & Testing |
| Yashwanta BS | UI/UX & Documentation |

---

# 📖 Abstract

UniAssist AI is a centralized AI-powered assistant platform designed to simplify knowledge management, document processing, intelligent conversations, and organizational collaboration. The system combines modern AI capabilities with secure user management to provide an efficient digital workspace for businesses, educational institutions, and organizations.

---

# ❗ Problem Statement

Organizations often rely on multiple disconnected applications for document management, AI assistance, communication, and knowledge sharing. This fragmentation reduces productivity, creates duplicate information, and increases the time required to retrieve critical information.

---

# 💡 Proposed Solution

UniAssist AI integrates AI-powered conversational assistance, document intelligence, secure authentication, knowledge retrieval, and administrative management into a single unified platform. By leveraging Retrieval-Augmented Generation (RAG) and intelligent document indexing, users can interact naturally with their organizational knowledge base while ensuring secure and scalable access.

---

# 🎯 Objectives

- Centralize organizational knowledge.
- Enable AI-powered conversations.
- Simplify document management.
- Improve productivity.
- Secure user and data management.
- Provide scalable cloud-ready architecture.

---

# ✨ Key Features

- 🔐 Secure JWT Authentication
- 👥 Multi-user Management
- 🤖 AI Chat Assistant
- 📄 Smart Document Upload
- 📚 Knowledge Base
- 🔍 Intelligent Search
- 🧠 Retrieval-Augmented Generation (RAG)
- 📊 Admin Dashboard
- 📈 Analytics Ready
- ⚡ Fast API Backend
- 🌐 Responsive Web Interface
- 🛡️ Role-Based Access Control
- ☁️ Cloud Deployment Ready

---

# 🛠 Technology Stack

| Category | Technology |
|-----------|------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | FastAPI, Python |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Authentication | JWT |
| AI | LangChain, LLM Integration |
| Vector Search | ChromaDB / Vector Database |
| Deployment | Docker |
| Version Control | Git & GitHub |

---

# 🏗 System Architecture

```mermaid
flowchart LR

User --> Frontend

Frontend --> FastAPI

FastAPI --> PostgreSQL

FastAPI --> AI Engine

AI Engine --> Vector Database

Vector Database --> Documents

FastAPI --> Authentication

Authentication --> JWT
```

---

# 🤖 AI Workflow

```mermaid
flowchart TD

User

↓

Chat Request

↓

Embedding Generation

↓

Vector Search

↓

Relevant Context

↓

Language Model

↓

AI Response
```

---

# 📂 Project Structure

```
UniAssist-AI/

backend/

frontend/

docs/

README.md

docker-compose.yml

.env.example
```

---

# 🔐 Authentication Flow

```
User Login

↓

Credentials Validation

↓

JWT Token Generation

↓

Protected APIs

↓

Authorized Access
```

---

# 🗄 Database

Major Modules

- Users
- Roles
- Documents
- Knowledge Base
- Conversations
- AI Responses
- Logs
- Settings

---

# 🔌 API Modules

| Module | Description |
|----------|-------------|
| Authentication | Login & Registration |
| Users | User Management |
| Chat | AI Conversation |
| Documents | Upload & Processing |
| Knowledge | Knowledge Base |
| Admin | Dashboard |
| Settings | Configuration |

---

# 🚀 Installation

## Backend

```bash
cd backend

pip install -r requirements.txt

uvicorn app.main:app --reload
```

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# ⚙ Environment Variables

```
DATABASE_URL=

JWT_SECRET=

OPENAI_API_KEY=

GEMINI_API_KEY=

VECTOR_DB_PATH=
```

---

# 🔒 Security Measures

- JWT Authentication
- Password Hashing
- Role-Based Access
- Input Validation
- CORS Protection
- Secure File Upload
- Environment Variable Protection

---

# 🧪 Testing

- Unit Testing
- API Testing
- Integration Testing
- Authentication Testing
- Performance Testing

---

# ⚡ Performance

- Optimized Database Queries
- Async API Processing
- Efficient Vector Search
- Modular Backend Architecture
- Responsive Frontend

---

# 🚧 Challenges

- AI Response Optimization
- Large Document Processing
- Multi-user Synchronization
- Secure Authentication
- Vector Search Performance

---

# 🔮 Future Scope

- Voice Assistant
- Mobile Application
- OCR Support
- Multi-language Support
- AI Analytics Dashboard
- Email & Calendar Integration
- Workflow Automation
- Multi-LLM Support

---

# 📸 Demo

### Dashboard



### AI Chat



### Document Upload



---

# 🎥 Demo Video



---

# 📚 References

- FastAPI Documentation
- React Documentation
- PostgreSQL Documentation
- SQLAlchemy Documentation
- LangChain Documentation
- Docker Documentation
- JWT Documentation

---

# 📜 License

This project is developed for academic and hackathon purposes.

---

<p align="center">

Made with ❤️ by Team UniAssist AI

</p>