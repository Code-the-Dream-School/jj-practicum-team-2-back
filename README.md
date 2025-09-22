
## Mentor-Student Session Management: Back-End Repository

Visit Website

Welcome to the back-end repository for the Mentor-Student Session Management platform — a system designed to streamline mentor-led lectures, Q&A sessions, and student participation. This platform empowers mentors to create sessions, manage their profiles, upload lecture recordings, and communicate schedule updates efficiently, while students can register for lectures, receive notifications, and revisit session recordings.

This repository contains the Node.js/Express server code for our application, interfacing with the frontend repository.

### Table of Contents

Key Features
Technologies Used
Quick Start
Authors

### Key Features

User Authentication and Management:
- Secure Registration and Login: Implemented using JWT for token-based authentication with cookies.
- Role-based Access: Separate roles for mentors and students, enabling personalized features.
- Profile Management: Mentors can update their profiles with bio, avatar, Zoom links, and session recordings.

Session Management:
- Create and Manage Sessions: Mentors can create lectures or Q&A sessions, assign them to classes, and update schedule details.
- Status Tracking: Sessions can be scheduled, ongoing, completed, or canceled.
- Recording Links: Upload and organize session recordings for easy access by students.

Class Management:
- Class CRUD Operations: Mentors can create classes, assign students, and link sessions to specific classes.
- Filtered Mentor Access: Students only see sessions from mentors teaching their enrolled classes.

### Technologies Used

Core Technologies:

express - Framework for handling backend logic

mongoose - ODM for MongoDB

dotenv - Environment variable management

Security Packages:

cors - Enables cross-origin requests

helmet - Secures app with HTTP headers

express-rate-limit - Prevents excessive requests

xss-clean - Sanitizes user input to prevent XSS attacks

bcryptjs - Password hashing for user credentials

Additional Utilities:

morgan - HTTP request logging for debugging

cookie-parser - Parses cookies for session management

nodemon - Auto-restart for development server

### Quick Start

Port Configuration

Back-end Server: Runs on port 5000 by default

Front-end App: Runs on port 3000

Local Development Setup

Clone Repository

git clone <repo-url>

cd mentor-student-session-management-backend

Install Dependencies:

npm install

Create .env File
Add the following variables:

MONGO_URI=mongodb://localhost:27017/mentorApp
JWT_SECRET=your-secret-key
JWT_LIFETIME=1d

Start Development Server

npm run dev

API Testing
Use Postman or open http://localhost:5000/api/ in your browser to test endpoints.

Authors

Daria Sidorko
Kseniia Zakharova















# Back-End Repo for Node/React Practicum

This will be the API for the front-end React app part of your practicum project.

These instructions are for the **front-end team** so they can setup their local development environment to run
both the back-end server and their front-end app. You can go through these steps during your first group meeting
in case you need assistance from your mentors.

> The back-end server will be running on port 8000. The front-end app will be running on port 3000. You will need to run both the back-end server and the front-end app at the same time to test your app.

### Setting up local development environment

1. Create a folder to contain both the front-end and back-end repos
2. Clone this repository to that folder
3. Run `npm install` to install dependencies
4. Pull the latest version of the `main` branch (when needed)
5. Run `npm run dev` to start the development server
6. Open http://localhost:8000/api/v1/ with your browser to test.
7. Your back-end server is now running. You can now run the front-end app.

#### Running the back-end server in Visual Studio Code

Note: In the below example, the group's front-end repository was named `bb-practicum-team1-front` and the back-end repository was named `bb-practicum-team-1-back`. Your repository will have a different name, but the rest should look the same.
![vsc running](images/back-end-running-vsc.png)

#### Testing the back-end server API in the browser

![browser server](images/back-end-running-browser.png)

> Update the .node-version file to match the version of Node.js the **team** is using. This is used by Render.com to [deploy the app](https://render.com/docs/node-version).
