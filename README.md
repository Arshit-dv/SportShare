# SportShare | Full-Stack Community Sports Platform


**SportShare** is a high-performance community coordination platform built for local sports enthusiasts. It facilitates seamless event creation, real-time participation tracking, and instantaneous user communication, all within a sleek, modern UI.

## 🌐 Live
👉 [sport-share.vercel.app](https://sport-share.vercel.app)

## 🚀 Key Features

-   **⚡ Real-Time Messaging**: Instant communication and unread message tracking powered by **Socket.io**.
-   **🛡️ Secure Authentication**: A robust, dual-layered auth architecture using **Firebase Authentication** synchronized with **MongoDB** for persistent user profiling.
-   **📅 Event Management**: Create, join, and discover local sports events with a dynamic, real-time participation flow.
-   **📸 Memory Galleries**: Cloudinary-integrated media galleries for event hosts and participants to share and manage memories.
-   **📱 Modern UI**: Fully responsive, dark-themed design with sleek micro-animations and intuitive navigation.

## Animated Preview



https://github.com/user-attachments/assets/4d638239-d934-4ad5-9071-50cb5d8ae212



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
