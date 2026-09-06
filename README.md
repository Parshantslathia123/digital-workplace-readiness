# Digital Workplace Readiness for Hybrid Work

A full-stack MERN application that gives organizations a single, role-based dashboard to run
hybrid work: attendance, tasks, teams, meetings, documents, real-time chat, notifications,
and a **Workplace Readiness Score** for every employee.

Built for a 7th-semester MERN Stack capstone project — designed to be fully functional,
easy to explain in a viva/demo, and easy to extend.

---

## 1. Project Objective

Hybrid work (a mix of remote, office, and flexible schedules) creates coordination gaps:
managers can't easily see who's ready to work effectively from where they are, and employees
lack a single place to manage tasks, attendance, meetings and communication.

This project solves that with **one common dashboard** that adapts based on role:

- **Employees** see their tasks, attendance, meetings, documents, chat, notifications, and
  their personal Workplace Readiness Score.
- **Admins** see organization-wide stats (headcount, online/offline, work-mode mix, task and
  attendance statistics, average readiness) plus full management tools for employees, teams,
  tasks, meetings, documents and reports.

---

## 2. Features

### Authentication & Security
- Register / Login / Logout with JWT
- Passwords hashed with bcrypt, never returned in API responses
- Protected routes (frontend) + role-based middleware (backend)
- Public registration always creates an **employee** account — admin accounts can only be
  created via the seed script (or by editing the database), never through public sign-up

### Common Role-Based Dashboard
- One `/dashboard` route, different content rendered based on `user.role`
- Admin: total/online/offline employees, work-mode breakdown, task stats, attendance today,
  average readiness score, charts
- Employee: active/completed tasks, readiness score, upcoming meetings, recent task list

### Employee Profile
Name, email, job title, department, team, work mode, status, weekly work schedule editor

### Hybrid Work & Weekly Schedule
Each employee can set Remote / Office / Hybrid / Off per day of the week

### Attendance
- Employees mark daily attendance + select work mode (one entry per day, enforced by a
  unique index in MongoDB)
- Admin can view all records, filter by employee/date/status/work mode, and see stats

### Task Management
- Admin creates tasks (title, description, assignee, priority, deadline)
- Employees update status/progress on their own tasks
- Statuses: Pending / In Progress / Completed — Priorities: Low / Medium / High / Urgent

### Team Management
- Admin creates/edits/deletes teams, assigns a leader and members
- Employees see their team and teammates

### Meeting Management
- Admin creates/edits/deletes meetings with date, time, duration, meeting link, and
  assigns teams and/or individual attendees
- Employees see meetings relevant to them and can open the link directly

### Document Management
- Upload via Multer (PDF, DOC/DOCX, XLS/XLSX, images, TXT, ZIP — size limit from `.env`)
- File metadata stored in MongoDB, files stored on disk in `server/uploads`
- Download, search, and delete (owner or admin)

### Real-Time Chat (Socket.IO)
- One-to-one chat between any employee and any admin
- Messages persisted in MongoDB with timestamps and read/unread status
- Live typing indicator, online/offline presence, and instant new-message notifications

### Notifications
- Triggered for: new task, task updates, new meeting, new document, new message,
  announcements, and can be extended to attendance reminders
- Notification bell with unread badge, click-to-mark-as-read, and "mark all as read"

### Workplace Readiness Score
```
Readiness Score = (Connectivity + Equipment + Schedule Sync) / 3
```
- Each factor is 0–100, self-reported (sliders) and editable by the employee
- Categories: 0–39 Needs Improvement · 40–59 Basic · 60–79 Good · 80–100 Excellent
- Progress bars, category badge, and dynamic improvement suggestions
- Admin can view readiness for the whole organization via `/api/readiness/all`

### Admin Management
Search/filter/edit employees, assign team & department, change work mode/status,
view readiness, monitor tasks and attendance, send organization-wide announcements

### Reports
Charts (via Recharts) for: tasks by status/priority, employees by department/work mode,
readiness score distribution, and a 14-day attendance trend

### Search & Filtering
Implemented for Employees, Tasks, Attendance, Documents, and Meetings (server-side query params)

---

## 3. Technology Stack

**Backend:** Node.js, Express.js, MongoDB, Mongoose, Socket.IO, JWT (`jsonwebtoken`),
bcrypt (`bcryptjs`), Multer, express-rate-limit, cors, dotenv

**Frontend:** React 18 (Vite), React Router v6, Axios, Socket.IO Client, Context API
(no Redux needed), Recharts for charts, plain responsive CSS (no framework lock-in)

---

## 4. Folder Structure

```
digital-workplace-readiness/
├── server/
│   ├── src/
│   │   ├── config/          # MongoDB connection
│   │   ├── controllers/     # Business logic for every module
│   │   ├── middleware/      # auth, role, error handling, rate limiting, upload
│   │   ├── models/          # User, Team, Task, Attendance, Document, Meeting, Message, Notification
│   │   ├── routes/          # REST endpoints per module
│   │   ├── seed/            # Database seed script
│   │   ├── socket.js        # Socket.IO server (chat, presence, notifications)
│   │   └── server.js        # App entry point
│   ├── uploads/              # Uploaded document files
│   ├── .env.example
│   └── package.json
├── client/
│   ├── src/
│   │   ├── api/              # Axios instance with interceptors
│   │   ├── components/       # Sidebar, Navbar, Modal, ProgressBar, StatusBadge, etc.
│   │   ├── context/           # AuthContext, SocketContext, NotificationContext
│   │   ├── layouts/           # DashboardLayout (sidebar + navbar shell)
│   │   ├── pages/              # One file per route
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css          # Full design system
│   ├── .env.example
│   ├── index.html
│   └── package.json
└── README.md
```

---

## 5. MongoDB Setup

You can use either a local MongoDB instance or MongoDB Atlas (recommended for easy setup).

### Option A — MongoDB Atlas (cloud, recommended)
1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Create a database user and allow your IP (or `0.0.0.0/0` for development)
3. Copy the connection string, e.g.
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/digital_workplace_readiness`
4. Paste it into `server/.env` as `MONGO_URI`

### Option B — Local MongoDB
1. Install MongoDB Community Server and start `mongod`
2. Use `MONGO_URI=mongodb://127.0.0.1:27017/digital_workplace_readiness`

No mock data is used for main functionality — every feature reads/writes real MongoDB data.

---

## 6. Environment Variables

**server/.env** (copy from `server/.env.example`)
```
MONGO_URI=mongodb://127.0.0.1:27017/digital_workplace_readiness
PORT=5000
NODE_ENV=development
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
UPLOAD_MAX_FILE_SIZE_MB=20
```

**client/.env** (copy from `client/.env.example`)
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

> Never commit real credentials. `.env` files are for local/deployment configuration only.

---

## 7. Installation & Running

### Backend
```bash
cd server
npm install
cp .env.example .env      # then edit MONGO_URI and JWT_SECRET
npm run seed               # populates demo data (see credentials below)
npm run dev                 # starts on http://localhost:5000 (nodemon)
# or: npm start             # production start
```

### Frontend
```bash
cd client
npm install
cp .env.example .env
npm run dev                 # starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser. The frontend talks to the backend at
`http://localhost:5000/api`, and Socket.IO connects to `http://localhost:5000`.

---

## 8. Seed Instructions

From the `server` folder:
```bash
npm run seed
```
This clears existing collections and inserts: 1 admin, 2 employees, 1 team, 3 tasks,
attendance records, 1 meeting, notifications, and sample chat messages.

### Demo Credentials
| Role     | Email               | Password       |
|----------|---------------------|----------------|
| Admin    | admin@company.com   | Admin@123      |
| Employee | priya@company.com   | Employee@123   |
| Employee | rohan@company.com   | Employee@123   |

You can also register new employee accounts from the `/register` page at any time —
admin accounts are intentionally not creatable through public registration.

---

## 9. API Overview

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Module        | Method & Route                          | Access        |
|---------------|------------------------------------------|---------------|
| Auth          | `POST /auth/register`                    | Public        |
|               | `POST /auth/login`                       | Public        |
|               | `POST /auth/logout`                      | Authenticated |
|               | `GET /auth/me`                           | Authenticated |
| Users         | `GET /users` (search/filter)             | Admin         |
|               | `GET /users/:id`                         | Authenticated |
|               | `PUT /users/profile`                     | Authenticated |
|               | `PUT /users/:id`                         | Admin         |
|               | `DELETE /users/:id`                      | Admin         |
|               | `GET /users/stats/dashboard`             | Admin         |
| Teams         | `GET /teams` / `GET /teams/:id`          | Authenticated |
|               | `POST /teams` / `PUT /teams/:id` / `DELETE /teams/:id` | Admin |
| Tasks         | `GET /tasks` / `GET /tasks/:id`          | Authenticated |
|               | `POST /tasks`                             | Admin         |
|               | `PUT /tasks/:id`                          | Owner or Admin |
|               | `DELETE /tasks/:id`                       | Admin         |
| Attendance    | `POST /attendance`                        | Authenticated |
|               | `GET /attendance` (filters)               | Authenticated |
|               | `GET /attendance/stats`                   | Authenticated |
| Documents     | `GET /documents` / `POST /documents`     | Authenticated |
|               | `GET /documents/:id/download`             | Authenticated |
|               | `DELETE /documents/:id`                   | Owner or Admin |
| Meetings      | `GET /meetings`                           | Authenticated |
|               | `POST /meetings` / `PUT /meetings/:id` / `DELETE /meetings/:id` | Admin |
| Messages      | `GET /messages/contacts`                  | Authenticated |
|               | `GET /messages/:userId`                   | Authenticated |
| Notifications | `GET /notifications`                      | Authenticated |
|               | `PUT /notifications/:id/read`             | Authenticated |
|               | `PUT /notifications/read/all`             | Authenticated |
|               | `POST /notifications/announcement`        | Admin         |
| Readiness     | `GET /readiness/me` / `PUT /readiness/me`| Authenticated |
|               | `GET /readiness/all`                      | Admin         |
| Reports       | `GET /reports`                            | Admin         |

Real-time chat runs over Socket.IO (`chat:send`, `chat:message`, `chat:typing`, `chat:read`,
`user:online`, `user:offline`, `notification:new`), authenticated with the same JWT passed
via `socket.handshake.auth.token`.

---

## 10. Quality Checklist (already verified in this build)

- ✅ Backend `npm install` completes cleanly
- ✅ Every backend `.js` file passes `node --check` (no syntax errors)
- ✅ Server starts, binds to the configured port, and serves `GET /api/health`
- ✅ Server fails **gracefully** with a clear log line if MongoDB is unreachable
  (`[MongoDB] Connection error: ...`) instead of crashing silently
- ✅ Frontend `npm install` completes cleanly
- ✅ Frontend `npm run build` completes with zero errors (Vite + Rollup production build)
- ✅ Every frontend API call matches an existing backend route and HTTP method
- ✅ CORS is restricted to `CLIENT_ORIGIN` from `.env`
- ✅ JWT errors return clear messages (expired vs invalid vs missing token)
- ✅ Multer rejects disallowed file types and oversized files with readable errors
- ✅ Global Express error handler normalizes Mongoose CastError/ValidationError/duplicate-key
  errors into consistent JSON responses

**Not yet run in this environment:** a live MongoDB instance was not available in the build
sandbox (no local `mongod`, and MongoDB Atlas/binary downloads are outside the sandbox's
network allowlist), so the seed script and live CRUD flows could not be executed end-to-end
here. Everything is implemented and verified for syntax/build correctness; run the steps in
Section 7 with your own MongoDB URI to complete end-to-end testing.

---

## 11. Customization Ideas

- Add file previews (PDF/image) instead of forced downloads
- Add email notifications alongside in-app notifications
- Add pagination to large tables (tasks, attendance, employees)
- Add a calendar view for meetings
- Add dark mode using the existing CSS custom properties in `index.css`
- Add automated attendance reminders via a cron job (`node-cron`) that creates
  `attendance` type notifications for employees who haven't checked in by a cut-off time

---

## 12. Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `CORS error` in browser console | `CLIENT_ORIGIN` in server `.env` doesn't match the frontend URL | Match it exactly, including port |
| `[MongoDB] Connection error` | Wrong `MONGO_URI`, IP not whitelisted on Atlas, or `mongod` not running | Check the URI and Atlas network access list |
| `401 Not authorized, no token provided` | Frontend not sending `Authorization` header | Confirm you're logged in; check `localStorage` for `dwr_token` |
| Socket.IO won't connect | `VITE_SOCKET_URL` mismatch or missing JWT | Confirm backend is running and token exists in `localStorage` |
| File upload fails with 400 | Unsupported file type or file bigger than `UPLOAD_MAX_FILE_SIZE_MB` | Use an allowed type or increase the limit in `.env` |
