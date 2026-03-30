# SportShare | Full-Stack Community Sports Platform

![favicon](https://github.com/user-attachments/assets/4c3d653f-5287-44da-b0ad-d3a9dce7fb7d)<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- Solid Background for visibility -->
  <circle cx="50" cy="50" r="48" fill="white" />
  
  <!-- Outer Ring (Black) -->
  <circle cx="50" cy="50" r="40" fill="none" stroke="black" stroke-width="8" />
  
  <!-- Middle Ring (Red) -->
  <circle cx="50" cy="50" r="25" fill="none" stroke="#ff0000" stroke-width="8" />
  
  <!-- Center Bullseye (Black) -->
  <circle cx="50" cy="50" r="8" fill="black" />
  
  <!-- Crosshairs (Black) for extra definition -->
  <line x1="50" y1="2" x2="50" y2="20" stroke="black" stroke-width="4" stroke-linecap="round" />
  <line x1="50" y1="80" x2="50" y2="98" stroke="black" stroke-width="4" stroke-linecap="round" />
  <line x1="2" y1="50" x2="20" y2="50" stroke="black" stroke-width="4" stroke-linecap="round" />
  <line x1="80" y1="50" x2="98" y2="50" stroke="black" stroke-width="4" stroke-linecap="round" />
</svg>

**SportShare** is a high-performance community coordination platform built for local sports enthusiasts. It facilitates seamless event creation, real-time participation tracking, and instantaneous user communication, all within a sleek, modern UI.

## 🚀 Key Features

-   **⚡ Real-Time Messaging**: Instant communication and unread message tracking powered by **Socket.io**.
-   **🛡️ Secure Authentication**: A robust, dual-layered auth architecture using **Firebase Authentication** synchronized with **MongoDB** for persistent user profiling.
-   **📅 Event Management**: Create, join, and discover local sports events with a dynamic, real-time participation flow.
-   **📸 Memory Galleries**: Cloudinary-integrated media galleries for event hosts and participants to share and manage memories.
-   **📱 Modern UI**: Fully responsive, dark-themed design with sleek micro-animations and intuitive navigation.

## Animated Preview



## 🛠️ Tech Stack

-   **Frontend**: React.js, Vite, Axios, React-Router-Dom
-   **Backend**: Node.js, Express.js
-   **Database**: MongoDB (Mongoose), Firebase Admin SDK
-   **Real-Time**: Socket.io
-   **Storage**: Cloudinary (Image management)
-   **Authentication**: Firebase SDK + Custom ID Sync middleware

## 🛡️ Technical Architecture: The "ID Sync"

One of the project's most robust features is its **Firebase-to-MongoDB synchronization**. When a user logs in via Firebase:
1.  Firebase handles the credential verification.
2.  Our backend middleware identifies the user by their unique Firebase UID.
3.  The system performs an **Atomic Sync** to ensure a corresponding user record exists in MongoDB, linking both datasets for a seamless profile experience.

## ⚙️ Setup & Installation

1.  **Clone & Install**:
    ```bash
    git clone [your-repo-link]
    cd SportShare
    npm install
    cd client && npm install
    cd ../server && npm install
    ```

2.  **Environment Variables**:
    -   Create `.env` files in both `client/` and `server/` directories.
    -   **Client**: `VITE_FIREBASE_...` keys and `VITE_API_URL`.
    -   **Server**: `MONGO_URI`, `FIREBASE_SERVICE_ACCOUNT_BASE64`, and `CLOUDINARY_...` credentials.

3.  **Run Development**:
    ```bash
    # From the root 
    npm start # Or run both dev servers individually
    ```

## 📜 License
This project is for educational and community use. 🕊️
