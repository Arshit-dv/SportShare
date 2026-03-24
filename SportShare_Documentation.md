# SportShare - Detailed Project Documentation

## 🏠 Project Overview
**SportShare** is a full-stack MERN application for sports community building. This document provides a deep dive into the code structure, file responsibilities, and logic flow of both the client and server.

---

## 🎨 Frontend Deep Dive (`/client`)

The frontend is a modern React application utilizing **Vite** for fast builds and **Vanish CSS** (custom variables) for a neon "Tokyo Night" aesthetic.

### 📍 Client Root Files
*   **`index.html`**: The single HTML page where the React application is mounted. It includes the Google Fonts and the entry script link.
*   **`package.json`**: Manages frontend dependencies like `react-router-dom`, `axios`, and `vite`.
*   **`vite.config.js`**: Configures the build tool and sets up the **proxy** so that frontend calls to `/api` are automatically forwarded to the backend server (port 5000).

### � Source Core (`/client/src`)
*   **`main.jsx`**: The entry point of the React application. It wraps the app in strict mode and renders the `<App />` component.
*   **`App.jsx`**: The central routing hub. It defines the page structure and uses `<Routes>` to map URLs to specific pages like Dashboard, Login, and Profile.
*   **`index.css`**: The design system. It defines global CSS variables (colors, spacing) and styles for buttons, inputs, and the "Tokyo Night" theme.
*   **`App.css`**: Contains layout-specific styles for the root container and high-level wrappers.

### 📁 Components (`/client/src/components`)
*   **`Sidebar.jsx`**: A modular navigation component. It handles the open/closed state of the menu and features a CSS/JavaScript animation of a bouncing sports emoji that changes on every bounce.
*   **`EventItem.jsx`**: A reusable card component that displays individual event details (title, sport, location, participants) and handles the "Join/Leave" logic.
*   **`EventForm.jsx`**: A controlled form used to host a new event. It validates user input before sending data to the `EventContext`.
*   **`Layout.jsx`**: A structural wrapper that ensures the Sidebar is consistently present on protected pages.
*   **`PrivateRoute.jsx`**: A security component that checks if a user is authenticated. If not, it redirects them to the login page.

### 📁 Context (State Management) (`/client/src/context`)
*   **`AuthContext.jsx`**: Manages the user's session. It handles login, registration, and logout, and stores the user's data in local storage to keep them logged in after a page refresh.
*   **`EventContext.jsx`**: Uses the `useReducer` hook to manage the state of all sports events. Functions include fetching events, adding new ones, and handling participant updates.

### 📁 Pages (`/client/src/pages`)
*   **`Landing.jsx`**: The public-facing splash page with high-end animations and feature highlights.
*   **`Dashboard.jsx`**: The primary user authenticated view. It includes the event feed and a dynamic search bar that filters events as you type.
*   **`Stats.jsx`**: A complex analytics page that translates raw event data into SVG-based donut and bar charts.
*   **`Profile.jsx`**: Handles detailed user bios, stat summaries, and integrated Cloudinary photo uploads.
*   **`Inbox.jsx`**: Manages social interactions, specifically accepting or declining friend requests.

---

## �️ Backend Deep Dive (`/server`)

The backend is a Node.js/Express server that serves as a RESTful API for the frontend.

### 📍 Server Root Files
*   **`server.js`**: The heart of the backend. It:
    1.  Loads environment variables from `.env`.
    2.  Connects to **MongoDB Atlas**.
    3.  Applies JSON parsing and CORS security middleware.
    4.  Registers API route prefixes (`/api/auth`, `/api/events`).
*   **`package.json`**: Manages backend dependencies like `bcryptjs` (passwords), `jsonwebtoken` (auth), and `mongoose` (database).

### 📁 Middleware (`/server/middleware`)
*   **`auth.js`**: A custom middleware that grabs the JWT token from the header, verifies it, and attaches the user's ID to the request object (`req.user`).
*   **`upload.js`**: Configures **Multer** and **Cloudinary**. This allows user-uploaded profile photos to be optimized and stored in the cloud.

### 📁 Models (Database Schema) (`/server/models`)
*   **`User.js`**: Defines the user schema. It includes metadata like age/gender, login credentials, and arrays for `friends` and `friendRequests` (referencing other user IDs).
*   **`Event.js`**: Defines the event schema. Each event is linked to a "creator" user and contains an array of participant user IDs.

### 📁 Routes (Endpoints) (`/server/routes`)
*   **`auth.js`**: 
    *   `POST /register`: Hashes passwords and saves new users.
    *   `POST /login`: Validates credentials and issues a JWT token.
    *   `PUT /profile`: Updates user metadata and handles Cloudinary image URLs.
    *   `POST /friend-request`: Manages the social logic of sending and accepting requests.
*   **`events.js`**:
    *   `GET /`: Fetches all events, sorted by date.
    *   `POST /`: Saves a new event created by the user.
    *   `PUT /join/:id`: Toggles the user's participation status for a specific match.

---

## � Data Flow Summary
1.  **User Action**: User clicks "Host Event" in the frontend.
2.  **Context Call**: `EventForm` calls `addEvent()` in `EventContext`.
3.  **API Call**: Axios sends a POST request to `/api/events` with the JWT token in the header.
4.  **Route Handling**: `server/routes/events.js` receives the request and validates the user via `middleware/auth.js`.
5.  **Database**: Mongoose saves the new event to MongoDB.
6.  **Response**: The server returns the new event; `EventContext` updates the global state, and the Dashboard automatically re-renders with the new match.
