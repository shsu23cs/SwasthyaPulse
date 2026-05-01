# SwasthyaPulse 🩺

## Overview

**SwasthyaPulse** is a specialized, real-time healthcare intelligence platform designed to monitor and analyze public discourse across digital social channels such as X (Twitter) and Reddit and medical forums. By leveraging advanced Artificial Intelligence and Natural Language Processing (NLP), the platform extracts safety signals, sentiment trends, and clinical insights from unstructured social data, transforming it into actionable clinical and strategic intelligence.

## Project Demo

<div align="center">
  <video src="assets/SwasthyaPulse.mp4" width="100%" controls>
    Your browser does not support the video tag.
  </video>
</div>



### Methodology
1.  **Automated Data Acquisition**: The system performs continuous monitoring of social media platforms (including X/Twitter and Reddit) to capture relevant conversations based on targeted healthcare keywords and therapeutic areas.
2.  **Semantic Analysis**: Utilizing state-of-the-art AI models, the platform performs deep semantic analysis to understand the context, intent, and sentiment of patient-generated content.
3.  **Clinical Entity Extraction**: The system automatically identifies and categorizes critical clinical data points, including:
    *   **Pharmacological Entities**: Identification of specific medications and treatment regimens.
    *   **Symptomatology**: Extraction of reported side effects, adverse events, and disease symptoms.
    *   **Sentiment Metrics**: Quantitative assessment of patient satisfaction, concerns, and emotional response to treatments.
4.  **Strategic Visualization**: Complex datasets are aggregated into intuitive dashboards, enabling healthcare professionals to monitor emerging trends, geographic hotspots, and sentiment shifts in real-time.

## Value Proposition

*   **Proactive Pharmacovigilance**: Identify potential safety signals and adverse drug reactions (ADRs) significantly earlier than traditional reporting methods.
*   **Patient-Centric Insights**: Gain a direct understanding of the "patient voice" to improve treatment adherence and healthcare delivery.
*   **Geospatial Intelligence**: Monitor the regional spread of health concerns and the efficacy of public health interventions.
*   **Scalable Analytics**: Eliminate the need for manual qualitative research by automating the analysis of thousands of data points daily.

## Key Features

- **Real-time Monitoring**: Periodic crawling of healthcare-related keywords using DuckDuckGo search integration.
- **AI-Powered Insights**:
  - **Sentiment Analysis**: Tracking public perception of medicines and treatments.
  - **Entity Extraction**: Identifying symptoms, medication names, and locations from unstructured text.
  - **Safety Signaling**: Detecting adverse event mentions in real-time.
- **Interactive Dashboards**: Comprehensive visualization of trends, geographic heatmaps, and sentiment distributions.
- **Secure Access**: Role-Based Access Control (RBAC) integrated with Clerk Authentication.
- **Automated Scheduling**: Background workers for continuous data acquisition and analysis.

## Tech Stack

### Frontend
- **Framework**: [React](https://reactjs.org/) + [TanStack Start](https://tanstack.com/start)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [Shadcn UI](https://ui.shadcn.com/) (Radix UI)
- **Visualization**: [Recharts](https://recharts.org/)
- **Auth**: [Clerk](https://clerk.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **ORM**: [SQLAlchemy](https://www.sqlalchemy.org/) with SQLite
- **NLP**: [SpaCy](https://spacy.io/) & [VaderSentiment](https://github.com/cjhutto/vaderSentiment)
- **Scheduler**: [APScheduler](https://apscheduler.readthedocs.io/)
- **Search**: DuckDuckGo Search API

---

## Setup Instructions

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **Bun** (Recommended) or **npm**

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   # Download SpaCy model
   python -m spacy download en_core_web_sm
   ```
4. Configure Environment Variables:
   Create a `.env` file in the `backend/` folder:
   ```env
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```
5. Run the server:
   ```bash
   uvicorn backend.main:app --reload --port 8001
   ```

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   bun install
   # OR
   npm install
   ```
3. Configure Environment Variables:
   Create a `.env` file in the `frontend/` folder:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   ```
4. Start the development server:
   ```bash
   bun dev
   # OR
   npm run dev
   ```

---

## Project Structure

```text
SwasthyaPulse/
├── backend/
│   ├── routers/          # API endpoints
│   ├── services/         # NLP, Crawler, and Scheduler logic
│   ├── models.py         # SQLAlchemy Database models
│   ├── schemas.py        # Pydantic validation schemas
│   └── main.py           # FastAPI entry point
├── frontend/
│   ├── src/
│   │   ├── components/   # UI Components
│   │   ├── routes/       # TanStack Router pages
│   │   └── hooks/        # Custom React hooks
│   └── vite.config.ts    # Frontend configuration with API proxy
└── README.md
```

## Authentication & Roles

SwasthyaPulse uses **Clerk** for identity management.
- **Admin**: Can create research projects, trigger crawls, and manage system settings.
- **Analyst**: Can view dashboards, export data, and monitor insights.

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
