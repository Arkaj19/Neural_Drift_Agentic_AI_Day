# Drishti AI: Event Guardian 🛡️

**Drishti AI: Event Guardian** is an AI-powered situational awareness platform designed for proactive crowd safety management during large-scale events. It provides a real-time, intelligent command center for security teams to monitor, analyze, and respond to incidents, ensuring a safer environment for everyone.

![Drishti AI](https://res.cloudinary.com/dams0r5uk/image/upload/v1753526208/Picture1_wlf2zp.jpg)


SS of Admin Dashboard:

![Drishti AI Dashboard](https://res.cloudinary.com/dams0r5uk/image/upload/v1755239920/e0596e3ca77b7bdadbf4e6a58e4f4b4221dbe2807421542949fae856a4d157f8_z2rcvo.png)

![Drishti AI Cam Feed Page](https://res.cloudinary.com/dams0r5uk/image/upload/v1755241466/cf22522010502412d556b0e81cca94e7561f01df0d76c2da2fdb069e78466251_a63gvu.png)

![Drishti AI Map-view Page](https://res.cloudinary.com/dams0r5uk/image/upload/v1755241475/4c08102057ea1a595d956b83eb21ccf4680d4dee0a2a2906fbca86cdac6c4edb_jzvefm.png)

![Drishti AI Grievance Page](https://res.cloudinary.com/dams0r5uk/image/upload/v1755241443/a0806a643b0b8c0b319efe925fa3bce46206f5597101ffb48e1d33ad47c57d1e_iu7uyj.png)

User-Page

![Drishti AI User Dashboard](https://res.cloudinary.com/dams0r5uk/image/upload/v1755241455/2974e53bf8a571b18c20c4b02cd01bed833a3963c79495a7c07800af1cbd8c93_xeaukf.png)

---

## ✨ Key Features

*   **Real-time Admin Dashboard:** A central hub displaying key metrics like active guards, live alerts, and open grievances with dynamic, animated counters.
*   **AI-Powered Summaries:** On-demand, Genkit-powered summaries of the entire event status, giving command center operators a high-level overview in seconds.
*   **Live Video Feeds:** Monitor multiple camera streams in real-time with automatic reconnection and status indicators for crowd density and alerts.
*   **Interactive Map View:** Visualize crowd density and points of interest on a live map using MapTiler, with clickable markers for detailed information.
*   **Automated Alert System:** An intelligent alert system that identifies and prioritizes potential issues like high crowd density and predicted crowding from the backend API.
*   **Grievance Management:** A dedicated view for admins to manage and resolve user-submitted grievances for medical issues and missing persons.
*   **User-Facing Portal:** A separate, user-friendly dashboard for event attendees to report issues.
    *   **AI Chatbot Assistant:** An empathetic chatbot (powered by Genkit) to guide users, answer questions, and automatically navigate them to the correct forms.
    *   **Report Forms:** Easy-to-use forms for submitting medical emergencies and missing person reports, including photo uploads.
*   **Secure Authentication:** Role-based login system for both Admins and Users, managed through Firebase.

---

## 🚀 Tech Stack

*   **Frontend:**
    *   **Framework:** [Next.js](https://nextjs.org/) (with App Router)
    *   **Language:** [TypeScript](https://www.typescriptlang.org/)
    *   **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
    *   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
    *   **Mapping:** [MapTiler SDK](https://maptiler.com/sdk/)
*   **Backend & Database:**
    *   **Database:** [Firebase Firestore](https://firebase.google.com/docs/firestore) (for user data, guards, grievances)
    *   **Authentication:** [Firebase](https://firebase.google.com/)
    *   **AI Integration:** [Google Genkit](https://firebase.google.com/docs/genkit) (with Gemini Models)
*   **External Services:**
    *   **Video Processing & Alerts API:** A separate backend service (assumed to be running on `localhost:5000`) that provides live feed data.

---

## 📦 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

*   [Node.js](https://nodejs.org/en) (v20 or later recommended)
*   `npm` or a compatible package manager
*   A [Firebase](https://firebase.google.com/) project
*   A [MapTiler](https://maptiler.com/) account for an API key

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd <repository-directory>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root of the project and add the following configuration keys. Replace the placeholder values with your actual keys from Firebase and MapTiler.

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...

# MapTiler API Key
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_api_key

# Google AI (for Genkit)
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Seed the Database (Optional but Recommended)

To populate your Firestore database with initial data for guards, medical staff, and ambulances, run the provided seed scripts:

```bash
# Seed the database with medical staff
npm run db:seed

# Seed the database with ambulance data
npm run db:seed:ambulances
```
You will also need to manually add an `admin` and a `users` collection to your Firestore database with at least one document each to test the login functionality.

### 5. Run the Application

This project requires two separate processes to be running concurrently: the Next.js frontend and the Genkit AI development server.

1.  **Start the Backend API:**
    Ensure your separate Python-based video and alert processing API is running on `http://127.0.0.1:5000`.

2.  **Start the Genkit Dev Server:**
    In a new terminal, run:
    ```bash
    npm run genkit:watch
    ```
    This will start the Genkit development server and watch for changes in your AI flows.

3.  **Start the Next.js Frontend:**
    In another terminal, run:
    ```bash
    npm run dev
    ```
    This will start the frontend development server, typically on `http://localhost:9002`.

Open your browser to `http://localhost:9002` to see the application in action!
