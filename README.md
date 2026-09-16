# Avani — Prasanna's Personal AI Assistant

Avani is a personal AI assistant designed and developed by Prasanna using Artificial Intelligence, Machine Learning, Generative AI, FastAPI, local LLMs, cloud AI, web search, voice assistance, and intelligent file/image processing.

Avani can run locally on Windows using Ollama and is also deployed as a web application using FastAPI and Render.

---

## 🚀 Live Demo

https://avani-eoxi.onrender.com

---

## 🖥️ Download Avani for Windows

### Windows Installer

Download and install Avani directly on your Windows device:
<p align="center">
<a href="https://github.com/zerobug-svg/Avani/raw/refs/heads/main/installer/Avani-Setup.exe">
<img src="https://img.shields.io/badge/⬇%20Download%20Avani%20for%20Windows-2563EB?style=for-the-badge&logo=windows&logoColor=white" alt="Download Avani for Windows">
</a>
</p>

After downloading:

1. Run `Avani-Setup.exe`
2. Follow the installation steps
3. Avani will create a Desktop shortcut
4. Launch Avani from the Desktop or Start Menu

---

# ✨ Features

## 🤖 AI Assistant

- Natural language conversations
- Context-aware responses
- Personal AI assistant experience
- Local AI using Ollama
- Cloud AI support
- AI fallback system
- Professional assistant identity

---

## 🧠 Memory System

Avani can remember information provided by the user.

Supported operations:

- Remember information
- Forget information
- View remembered information
- Use memory as context during conversations

Example:

```text
Remember that my favorite programming language is Python.
```

---

## 📋 Task Management

Avani provides a task management system for organizing and tracking tasks.

Supported operations:

- Create tasks
- View tasks
- Complete tasks
- Undo completed tasks
- Delete tasks
- Use tasks as conversation context

Example:

```text
Create a task to complete my Python project.
```

---

## 📝 Notes Management

Avani provides a local notes system for creating and managing personal and technical notes.

Supported operations:

- Create notes
- View notes
- Search notes
- Edit notes
- Delete notes
- Use notes as conversation context

Example:

```text
Create a note about Machine Learning algorithms.
```

---

## 🎙️ Voice Assistance

Avani supports voice-based interaction using browser speech technologies.

Supported operations:

- Voice input
- Speech-to-text conversion
- Automatic message sending
- Text-to-speech conversion
- Voice responses
- Female voice support

Example:

```text
Speak to Avani using the microphone.
```

---

## 📄 File Intelligence

Avani can process uploaded documents and answer questions based on their content.

Supported file formats:

- PDF
- TXT
- DOCX

Supported operations:

- Upload documents
- Extract document content
- Ask questions about documents
- Summarize documents
- Analyze document information

Example:

```text
Upload a PDF and summarize its contents.
```

---

## 🖼️ Image Intelligence

Avani can analyze uploaded images using AI vision capabilities.

Supported image formats:

- PNG
- JPG
- JPEG

Supported operations:

- Upload images
- Analyze image content
- Describe images
- Answer questions about images
- Perform visual understanding

Example:

```text
Upload an image and ask:
"What is present in this image?"
```

---

## 🌐 Web Search

Avani can search the web when current or external information is required.

Supported operations:

- Search the web
- Retrieve search results
- Analyze search results
- Generate AI-powered answers
- Provide source information

Example:

```text
Search the latest information about Artificial Intelligence.
```

---

## 🧮 Calculator

Avani includes a calculator for performing mathematical calculations directly through the assistant.

Supported operations:

- Addition
- Subtraction
- Multiplication
- Division
- Mathematical expressions

Example:

```text
Calculate 125 * 48.
```

---

## ⏰ Reminder

Avani provides a simple reminder capability for time-based notifications.

Supported operations:

- Create reminders
- Set reminder duration
- Display reminder notifications

Example:

```text
Remind me in 10 minutes to check my project.
```

---

## 🎓 Learning Hub

Avani includes a Learning Hub designed to support technical learning and AI/ML development.

Available learning areas:

- Python
- Machine Learning
- Artificial Intelligence
- FastAPI
- AI/ML Roadmap

Supported operations:

- Learn technical concepts
- Explore programming topics
- Understand AI/ML concepts
- Follow learning roadmaps
- Get technical explanations

Example:

```text
Teach me Machine Learning from the basics.
```

---

## 🛠️ Developer Tools

Avani provides assistance with programming and software development.

Supported operations:

- Code assistance
- Code explanation
- Debugging assistance
- Programming guidance
- Problem solving
- Technical explanations

Example:

```text
Explain this Python code.
```

---

## 🪟 Windows System Automation

Avani supports Windows system automation through natural-language commands.

Supported operations:

- Open websites
- Open Windows applications
- Open folders
- Open Windows settings
- Increase volume
- Decrease volume
- Set exact volume
- Increase brightness
- Decrease brightness
- Set exact brightness
- Control Wi-Fi
- Control media
- Take screenshots
- Access camera
- Lock Windows
- Restart Windows with confirmation
- Shut down Windows with confirmation

Examples:

```text
Open YouTube.
```

```text
Increase the volume.
```

```text
Set brightness to 70%.
```

```text
Open Windows settings.
```

---

## 🖥️ Windows Desktop Application

Avani can run as a standalone Windows desktop application.

The desktop application provides:

- Native Windows application experience
- Avani's complete web interface
- Local FastAPI backend
- AI interaction
- Voice assistance
- File intelligence
- Image intelligence
- Web search
- Windows automation
- Persistent application data

The application is packaged using PyInstaller and distributed through a Windows installer.

Example:

```text
Launch Avani from the Windows Desktop.
```

---

## 🏗️ Architecture

Avani follows a modular architecture combining a frontend interface, FastAPI backend, AI providers, web search, local storage, and Windows desktop integration.

```text
                         ┌─────────────────────┐
                         │       User          │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Avani Frontend    │
                         │   HTML / CSS / JS   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   FastAPI Backend   │
                         │       main.py       │
                         └──────┬──────┬───────┘
                                │      │
                 ┌──────────────┘      └──────────────┐
                 ▼                                    ▼
        ┌─────────────────┐                  ┌─────────────────┐
        │    AI Layer     │                  │   Web Search    │
        │                 │                  │                 │
        │ Ollama          │                  │ Tavily          │
        │ OpenRouter      │                  │                 │
        │ Vision Models   │                  └─────────────────┘
        └─────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Local Windows   │
        │ Automation      │
        └─────────────────┘
```

---

## ⚙️ Technologies Used

### Programming Languages

- Python
- JavaScript
- HTML
- CSS

### Backend

- FastAPI
- Uvicorn
- Pydantic

### Artificial Intelligence

- Ollama
- OpenRouter
- Large Language Models
- Vision-capable AI models
- Generative AI

### AI and Data Processing

- PDF processing
- DOCX processing
- Image processing
- Natural Language Processing
- Computer Vision

### Web Search

- Tavily Search API

### Desktop Application

- PyWebView
- PyInstaller
- Inno Setup

### Cloud

- Render

### Development Tools

- Visual Studio Code
- Git
- GitHub
- PowerShell

---

## 📁 Project Structure

```text
Avani/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── main.py
├── desktop_app.py
├── Avani.iss
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

Runtime and generated folders such as `venv`, `uploads`, `uploaded_files`, `build`, `dist`, and `installer` are excluded from normal source-code tracking where appropriate.

---

## ☁️ Cloud Deployment

Avani is deployed as a web application using FastAPI and Render.

The cloud version supports:

- AI conversations
- Cloud AI processing
- Web search
- File intelligence
- Image intelligence
- Avani's web interface

Live application:

https://avani-eoxi.onrender.com

---

## 💾 Data Persistence

Avani uses local browser storage to maintain important user data.

Persistent information includes:

- Chat history
- Tasks
- Notes
- Memory

This allows information to remain available when Avani is reopened.

Example:

```text
Close and reopen Avani to access previously saved tasks and conversations.
```

---

## 🔐 Environment Configuration

Sensitive configuration is stored using environment variables instead of being directly written into the source code.

Configuration includes:

- AI provider settings
- AI API credentials
- Web search API credentials
- AI model configuration

Example:

```text
.env
```

The `.env` file is excluded from Git tracking.

---

## 🤖 AI Provider Support

Avani is designed to support both local and cloud-based AI processing.

Supported AI technologies include:

- Ollama
- OpenRouter
- Large Language Models
- Vision-capable AI models

Local AI allows Avani to operate using Ollama, while cloud AI enables additional AI capabilities when configured.

---

## 📦 Windows Installer

Avani includes a Windows installer for simplified installation.

The installer:

- Installs Avani
- Creates a Desktop shortcut
- Creates a Start Menu shortcut
- Provides an option to launch Avani after installation

Installer file:

```text
Avani-Setup.exe
```

---

## 🧪 Testing

Avani is tested during development to verify its major features and application workflows.

Testing areas include:

- AI chat
- Memory
- Tasks
- Notes
- Voice assistance
- File intelligence
- Image intelligence
- Web search
- Calculator
- Reminders
- Windows automation
- Desktop application
- Data persistence

---

## 🔄 Development Journey

Avani was developed progressively from a basic AI assistant into a multi-functional personal AI assistant.

Major development stages included:

1. Initial AI chat functionality
2. FastAPI backend development
3. Ollama local AI integration
4. Personalized Avani interface
5. Memory system
6. Task management
7. Notes management
8. Learning Hub
9. Developer tools
10. Chat history
11. Voice assistance
12. File intelligence
13. Image intelligence
14. Web search
15. Windows system automation
16. Desktop application
17. Windows installer
18. Cloud deployment
19. GitHub project publication

---

## 🎯 Why Avani Was Built

Avani was created as a practical AI/ML engineering project to combine multiple modern technologies into one usable application.

The project demonstrates practical implementation of:

- Artificial Intelligence
- Machine Learning concepts
- Generative AI
- Large Language Models
- Natural Language Processing
- Computer Vision
- AI agents and automation
- API development
- Web application development
- Desktop application development
- Cloud deployment
- Software engineering practices

The goal is to create a personal assistant that can interact with users, understand requests, process information, search the web, work with files and images, and perform supported system operations.

---

## 🔮 Future Scope

Avani can be extended with additional AI, automation, and intelligent agent capabilities.

Possible future improvements include:

- Advanced long-term memory
- Multi-agent workflows
- Advanced task automation
- Improved document intelligence
- Advanced computer vision
- Additional AI model integrations
- Improved voice interaction
- Advanced agentic capabilities
- MLOps integration
- Additional productivity tools
- Expanded desktop automation
- Mobile application support

---

## 👨‍💻 Developer

Avani is designed and developed by Prasanna as a personal AI assistant project.

**Developer:** Prasanna

**Role:** AI/ML Engineer

**Email:** adhavprasamna@gmail.com

Areas demonstrated through the project:

- Artificial Intelligence
- Machine Learning
- Generative AI
- Natural Language Processing
- Computer Vision
- Python
- FastAPI
- JavaScript
- Cloud Deployment
- Desktop Application Development

---

## 🔗 GitHub Repository

Avani's source code is available on GitHub.

https://github.com/zerobug-svg/Avani

---

## 📜 License

Avani is created for personal, educational, learning, and portfolio purposes.

Copyright © 2026 Prasanna.

---

## ⭐ Avani

Avani is Prasanna's personal AI assistant combining Artificial Intelligence, Machine Learning, Generative AI, automation, voice interaction, file intelligence, image intelligence, web search, and software engineering.

```text
Hi, I am Avani — Prasanna's AI assistance.
```
