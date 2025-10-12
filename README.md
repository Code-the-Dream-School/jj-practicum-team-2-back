# 💻 MentorHub — Back-End Repository

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-black?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-4EA94B?logo=mongodb&logoColor=white)](https://mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-red?logo=jsonwebtokens)](https://jwt.io/)

Welcome to the **MentorHub Back-End**. This Node.js back-end handles API requests, user management, and session data, providing a seamless experience for the React front-end. MentorHub is a comprehensive mentorship management platform that connects students with experienced mentors through structured learning sessions.

## 📋 Table of Contents

- [🛠 Technologies](#-technologies)
- [✨ Key Features](#-key-features)
- [🚀 Setting Up Local Development](#-setting-up-local-development)
- [🔐 Environment Variables](#-environment-variables)
- [📚 API Documentation](#-api-documentation)
- [👥 Authors](#-authors)

## 🛠 Technologies

### **Core Frameworks**
- **Node.js** – JavaScript runtime for building server-side applications
- **Express.js** – Minimal and flexible web framework for RESTful APIs

### **Database & ODM**
- **MongoDB Atlas** – Cloud-hosted NoSQL database for scalable data storage
- **Mongoose** – Object Document Mapping with schema validation and relationships

### **Authentication & Security**
- **jsonwebtoken (JWT)** – Token-based user authentication with role-based access control
- **bcryptjs** – Password hashing for security
- **cors** – Handles Cross-Origin Resource Sharing for frontend-backend communication
- **express-rate-limit** – API rate limiting middleware for security protection
- **cookie-parser** – Secure HTTP-only cookie handling for authentication

### **Developer Tools**
- **nodemon** – Auto-restarts server on file changes during development
- **dotenv** – Loads environment variables for secure configuration
- **morgan** – HTTP request logger middleware for debugging and monitoring

## ✨ Key Features

### **🔐 Authentication**
- User registration and login with role-based access (Student, Mentor, Admin)
- Passwords hashed with bcrypt for secure storage
- JWT-based authentication with HTTP-only signed cookies
- Password reset functionality with secure token generation

### **👤 User & Mentor Profiles**
- CRUD operations for user profiles with role-specific features
- Mentor profiles with bio, Zoom links, and teaching statistics
- Student profiles with learning goals and progress tracking
- Avatar support and profile customization

### **📅 Session & Attendance Management**
- Create, update, and manage learning sessions with capacity control
- Session status tracking (scheduled → ongoing → completed → canceled)
- Digital attendance marking with automated reporting
- Session registration system for students
- Real-time dashboard analytics for both mentors and students

### **🏫 Class Management**
- Default class assignment for new students
- Session-class relationships for organized learning paths
- Mentor access control based on class assignments

## 🚀 Setting Up Local Development

### **Prerequisites**
- **Node.js 18+** ([Download here](https://nodejs.org/))
- **MongoDB 6+** ([MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or local installation)
- **npm** or **yarn** package manager

### **Installation Steps**

1. **Create a project folder** to hold both front-end and back-end repositories
2. **Clone this repository:**
   ```bash
   git clone https://github.com/Code-the-Dream-School/jj-practicum-team-2-back.git
   cd jj-practicum-team-2-back
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Create environment file** (see [Environment Variables](#-environment-variables) section)

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Verify installation:**
   - Open [http://localhost:8000/api/v1/](http://localhost:8000/api/v1/) in your browser
   - You should see the API welcome message: "This is a full stack app!"

> **Note:** The back-end server runs on port **8000** by default. The front-end app runs on port **5173**. You'll need to run both simultaneously for full functionality.

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Environment Configuration
NODE_ENV=development
PORT=8000

# Database Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mentorhub

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-256-characters-for-security
JWT_LIFETIME=7d
JWT_RESET_SECRET=your-reset-secret-different-from-main-jwt-secret
JWT_RESET_PASSWORD_EXPIRES_IN=1h

# Frontend URL for CORS (for production deployment)
FRONTEND_URL=http://localhost:5173
```

### **Required Environment Variables:**
- `MONGO_URI` – MongoDB connection string (Atlas or local)
- `JWT_SECRET` – Secret key for JWT token generation (min. 32 characters)
- `JWT_RESET_SECRET` – Separate secret for password reset tokens
- `JWT_LIFETIME` – Token expiration time (e.g., 7d, 24h)
- `JWT_RESET_PASSWORD_EXPIRES_IN` – Reset token expiration (e.g., 1h)

## 📚 API Documentation

### **Authentication Endpoints**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| `POST` | `/api/v1/auth/register` | User registration | Public |
| `POST` | `/api/v1/auth/login` | User login | Public |
| `DELETE` | `/api/v1/auth/logout` | User logout | Auth Required |
| `GET` | `/api/v1/auth/me` | Get current user | Auth Required |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset | Public |
| `POST` | `/api/v1/auth/reset-password` | Reset password | Public |

### **Session Management**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| `GET` | `/api/v1/sessions/student-dashboard` | Student dashboard data | Student |
| `GET` | `/api/v1/sessions/mentor-dashboard` | Mentor dashboard data | Mentor |
| `POST` | `/api/v1/sessions` | Create new session | Mentor |
| `GET` | `/api/v1/sessions/:id` | Get session details | Auth Required |
| `PUT` | `/api/v1/sessions/:id` | Update session | Mentor |
| `DELETE` | `/api/v1/sessions/:id` | Delete session | Mentor |
| `POST` | `/api/v1/sessions/:id/register` | Register for session | Student |
| `DELETE` | `/api/v1/sessions/:id/unregister` | Unregister from session | Student |
| `POST` | `/api/v1/sessions/:id/attendance` | Mark attendance | Mentor |
| `PUT` | `/api/v1/sessions/:id/status` | Update session status | Mentor |

### **User Management**

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| `GET` | `/api/v1/user/myProfile` | Get own profile | Auth Required |
| `GET` | `/api/v1/user/:id` | Get user profile | Auth Required |
| `PUT` | `/api/v1/user/:id` | Update user profile | Owner/Admin |
| `DELETE` | `/api/v1/user/:id` | Delete user | Admin |

### **Example API Responses**

**Session Creation:**
```json
{
  "_id": "session_id",
  "title": "React Fundamentals",
  "description": "Introduction to React components",
  "mentorId": "mentor_id",
  "date": "2024-12-01T15:00:00.000Z",
  "duration": 60,
  "capacity": 15,
  "status": "scheduled",
  "participants": [],
  "zoomLink": "https://zoom.us/j/123456789"
}
```

**Student Dashboard:**
```json
{
  "thisWeek": {
    "upcoming": [...],
    "inProgress": [...],
    "past": [...]
  },
  "stats": {
    "attendedThisWeek": 2,
    "weeklyGoal": 3,
    "weeklyGoalMet": false
  },
  "myRegistrations": ["session_id_1", "session_id_2"]
}
```

## 👥 Authors

| Role | Developer | GitHub |
|------|-----------|---------|
| **Backend** | Daria Sidorko | [@DariaSidorko](https://github.com/DariaSidorko) |
| **Full Stack** | Kseniia Zakharova | [@Ligo-code](https://github.com/Ligo-code) |
| **Frontend** | Des McCl | [@desmccl](https://github.com/desmccl) |
| **Frontend** | Aman Leg | [@leg-aman](https://github.com/leg-aman) |

---

## 📞 Support

If you encounter any issues:
1. Check the [Issues](https://github.com/Code-the-Dream-School/jj-practicum-team-2-back/issues) page
2. Review the API documentation above
3. Contact the development team

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ by the Code the Dream Team**
