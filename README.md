# SportShare

A MERN stack sports event management platform.

## Prerequisites

- Node.js
- MongoDB (Must be running locally on port 27017)

## Setup

1.  **Clone the repository** (if applicable)
2.  **Install Dependencies**:

    ```bash
    # Server
    cd server
    npm install

    # Client
    cd ../client
    npm install
    ```

## Running the App

You need to run both the backend and frontend servers.

1.  **Start Backend**:
    ```bash
    cd server
    npm run dev
    ```
    Runs on `http://localhost:5000`

2.  **Start Frontend**:
    ```bash
    cd client
    npm run dev
    ```
    Runs on `http://localhost:5173`

## Environment Variables

**Server (.env)**:
```
PORT=5000
MONGO_URI=your_mongodb_atlas_uri_here
JWT_SECRET=your_jwt_secret_key_here
```
