# DistraKill

**DistraKill** is a student productivity and focus mobile application built with **React Native and Expo**. It is designed to help students reduce distractions, organize their studies, improve focus, and access useful study support from one application.

The app combines task planning, focus tracking, Islamic duas, AI-powered study assistance, and a modern light/dark user interface.

---

## ✨ Features

### 🏠 Student Dashboard
- Clean student-focused dashboard
- Quick access to important study tools
- Displays useful study information
- Supports light and dark themes

### 📚 Study Planner
- Create and manage study tasks
- Track pending and completed tasks
- Organize tasks by date
- View what needs to be studied today
- AI Assistant can access planner information

### ⏱️ Focus Mode
- Focus/Pomodoro-style study sessions
- Track completed focus sessions
- Monitor focus progress
- AI Assistant can provide focus progress information

### 🤖 AI Assistant
DistraKill includes an AI-powered assistant that supports both app-specific and general questions.

The assistant can answer questions such as:

- "What should I study today?"
- "What are my pending tasks?"
- "Give me a dua for studying."
- "How is my focus progress?"
- "What is my name?"
- "Explain active recall."
- "Explain photosynthesis simply."

General questions are handled using the **Google Gemini API**, while app-related questions use the user's DistraKill data.

The AI Assistant also supports:
- Streaming responses
- Conversation context
- Suggested prompts
- App-aware responses
- Fast Gemini Flash model integration

### 🤲 Dua Section
Students can access duas based on different situations, including:

- Studying
- Stress
- Exams
- Forgetfulness
- Seeking knowledge
- Difficult situations

### 👤 Profile
- Student profile information
- User-specific application data
- Personalized AI responses

### 🌙 Light & Dark Mode
DistraKill includes a global theme system with:

- Dark mode
- Light mode
- Persistent theme preference
- Theme toggle throughout the application

### ✨ Animated Background
The authenticated application includes a **GhostFibers-inspired animated background**.

- Animated cyan/teal fibers
- Light and dark mode support
- WebGL-based experience on web
- Lightweight mobile-compatible animation
- Designed to remain behind application content without blocking interaction

---

# 🛠️ Technology Stack

DistraKill is built using:

- **React Native**
- **Expo**
- **Expo Router**
- **TypeScript**
- **Firebase Authentication**
- **Cloud Firestore**
- **Google Gemini API**
- **AsyncStorage**
- **React Native Animated API**
- **WebGL / GhostFibers for web animation**
- **Git & GitHub**

---

# 📂 Project Structure

```text
DistraKill/
│
├── app/
│   ├── (app)/
│   │   └── (tabs)/
│   │       ├── home.tsx
│   │       ├── ai-assistant.tsx
│   │       ├── study-planner.tsx
│   │       ├── profile.tsx
│   │       └── _layout.tsx
│   │
│   └── _layout.tsx
│
├── components/
│   ├── backgrounds/
│   └── ui/
│
├── config/
│   └── firebase.ts
│
├── contexts/
│   └── theme-context.tsx
│
├── hooks/
│
├── services/
│   ├── ai-service.ts
│   ├── general-ai-service.ts
│   └── app-context-service.ts
│
├── assets/
│
├── docs/
│
├── .env.local
├── .gitignore
├── package.json
└── README.md
```

> The exact structure may change as development continues.

---

# 🚀 Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/beelabuilds/DistraKill.git
```

Enter the project directory:

```bash
cd DistraKill
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

Create a file named:

```text
.env.local
```

in the root directory.

Add your Gemini API key:

```env
EXPO_PUBLIC_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

### ⚠️ Important

Never commit your real API key to GitHub.

The following environment files should remain ignored by Git:

```text
.env
.env.local
.env*.local
```

The current Gemini environment variable approach is intended for development and university demonstration purposes.

For a production application, sensitive AI access should be moved to a secure backend or another protected architecture.

---

# ▶️ Running the Application

Start Expo using:

```bash
npx expo start --clear
```

After Expo starts:

### Web

Press:

```text
w
```

to open the application in your browser.

### Mobile

Open **Expo Go** on your phone and scan the QR code displayed by Expo.

If the phone cannot connect through the normal LAN connection, use:

```bash
npx expo start --tunnel --clear
```

---

# 🔥 Firebase

DistraKill uses Firebase for application services including:

### Authentication

- Email/password registration
- Login
- User authentication

### Cloud Firestore

Firestore stores application information such as:

```text
users
tasks
focusSessions
duaas
```

Firebase Storage is not currently required for the application's MVP.

---

# 🤖 AI Architecture

The AI Assistant uses two main response paths.

## App-Specific Questions

Questions related to DistraKill data are handled internally.

Examples:

```text
What should I study today?
What are my pending tasks?
Give me a dua for studying.
How many focus
