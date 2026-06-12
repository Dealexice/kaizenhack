# Zen Learn — Turn Assessment Feedback into Growth

**Zen Learn** is a premium, Google NotebookLM-style AI reflection workspace designed for King's College London (KCL) students. It addresses the fragmentation of feedback by helping students analyze criteria, connect grader comments to specific learning outcomes (LOs), and undertake targeted revision exercises.

## 🚀 Live Demo
Access the deployed application on Vercel:  
👉 **[Zen Learn Live Link](https://kaizenhack-jumx4r578-duycoi1927-3018s-projects.vercel.app)**

---

## 🎯 The Core Problem & Solution

### **The Problem**
NSS surveys highlight that KCL students consistently desire better clarity and structure around assessment feedback. Grader comments are often fragmented, leaving students unsure of:
- Whether an issue or weakness is recurring.
- Which specific learning outcome (LO) a comment maps to.
- What concrete steps or module resources will help them improve.

### **The Solution**
Zen Learn integrates course resources, marking criteria, and grader comments into an in-house workspace where AI acts as a **Reflection Coach**:
- Mapped dynamically using a custom **BM25 Retrieval-Augmented Generation (RAG)** pipeline.
- Incentivizes self-guided study through a structured **K-points gamification** framework.

---

## 🌟 Key Features (In-Scope MVP)

1. **Three-Panel Interactive Workspace**:
   - **Left Panel (Resources)**: Upload or paste rubrics, mark schemes, learning outcomes, and grader feedback.
   - **Centre Panel (Reflect/Chat)**: Chat with a dedicated reflection coach that references your documents using clickable citation chips.
   - **Right Panel (Growth)**: View your structured strengths/weaknesses diagnosis, progress history, practice tasks, and cumulative K-points.

2. **Sequential Resource Labeling & Ordering**:
   - All added feedback documents are automatically sorted chronologically by upload date.
   - Prominently labeled in the sidebar (e.g. `Resource 1`, `Resource 2`, `Resource 3`).

3. **Three-Dot Action Menu**:
   - Easily **Edit** or **Delete** uploaded resources.
   - Editing a resource's text automatically triggers client-side re-chunking so that RAG queries remain in sync.

4. **Weakness Diagnosis & Strengths Cards**:
   - Maps grades/feedback to specific module outcomes.
   - Flags recurring weaknesses with severity indicators.

5. **Practice Tasks & K-Points**:
   - Actionable study exercises generated for weaknesses.
   - Earn K-points upon completing tasks.

6. **Tutor CTA**:
   - Automatically prompts the student to schedule a session when a weakness is flagged as recurring (seen in $\geq$ 2 assessments).

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database & Auth**: [Firebase](https://firebase.google.com/) (Auth, Cloud Firestore)
- **AI Core**: [DeepSeek API](https://www.deepseek.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (KCL crimson `#E12726` and blue `#0072CE` design system)

---

## 💻 Local Development Setup

### **Prerequisites**
Ensure you have [Node.js](https://nodejs.org/) installed.

### **Installation**
1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/Dealexice/kaizenhack.git
   cd kaizen
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

### **Configuration**
Create a `.env.local` file in the root directory and configure the following credentials:
```env
# DeepSeek API config
DEEPSEEK_API_KEY=your_deepseek_api_key

# Firebase Client config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### **Running the App**
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application locally.
