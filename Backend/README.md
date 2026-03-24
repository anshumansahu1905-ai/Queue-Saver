# QueueSaver - Backend API

## Stack
- **Express.js** — REST API
- **MongoDB + Mongoose** — Database
- **Socket.IO** — Real-time queue updates
- **JWT** — Authentication
- **bcryptjs** — Password hashing

---

## Getting Started

```bash
npm install
npm start
```

Server runs on `http://localhost:3000`

---

## Environment Variables (`src/.env`)

```
MongoUri=mongodb://localhost:27017/QueueSaver
PORT=3000
JWT_SECRET=your_secret_here
FRONTEND_URL=http://localhost:5173
```

---

## User Roles
| Role    | Description                          |
|---------|--------------------------------------|
| `admin` | Shop owner / Doctor — manages queue  |
| `user`  | Patient / Customer — joins queue     |

---

## API Reference

### Auth Routes (`/api/auth`)

| Method | Endpoint             | Auth | Description        |
|--------|----------------------|------|--------------------|
| POST   | `/user/register`     | No   | Register new user  |
| POST   | `/user/login`        | No   | Login & get token  |

**Register body:**
```json
{ "name": "Dr. Sharma", "email": "dr@example.com", "password": "pass123", "role": "admin" }
```

**Login response:**
```json
{ "token": "...", "user": { "_id": "...", "name": "...", "role": "admin" } }
```

---

### Queue Routes (`/api/queue`)

| Method | Endpoint                  | Auth    | Description                          |
|--------|---------------------------|---------|--------------------------------------|
| POST   | `/join`                   | No      | Join a queue (via QR scan)           |
| GET    | `/position/:entryId`      | No      | Get your live position               |
| GET    | `/shops`                  | No      | List all admin shops                 |
| GET    | `/:shopId`                | ✅ Yes  | Get full queue (doctor/admin view)   |
| PATCH  | `/status/:entryId`        | ✅ Yes  | Update entry status                  |
| DELETE | `/:entryId`               | ✅ Yes  | Remove entry from queue              |
| GET    | `/qr/:shopId`             | ✅ Yes  | Get QR code URL for shop             |

**Join Queue body:**
```json
{ "shopId": "abc123", "patientName": "Rahul", "phone": "9876543210" }
```

**Join Queue response:**
```json
{ "tokenNumber": 5, "position": 5, "patientName": "Rahul", "_id": "..." }
```

**Update Status body:**
```json
{ "status": "in-progress" }
```
Status values: `waiting` | `in-progress` | `completed` | `cancelled`

---

## Socket.IO Events

### Client → Server (emit)
| Event        | Payload              | Description                                |
|--------------|----------------------|--------------------------------------------|
| `join_shop`  | `shopId` (string)    | Admin joins shop room to get live updates  |
| `join_entry` | `entryId` (string)   | Patient joins their room for status alerts |

### Server → Client (listen)
| Event            | Payload                        | Description                              |
|------------------|--------------------------------|------------------------------------------|
| `queue_updated`  | `{ queue: [...] }`             | Full updated queue list for admin view   |
| `status_updated` | `{ status, message }`          | Patient notified when their status changes|

### Frontend Usage Example
```javascript
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000');

// Admin dashboard — listen for queue changes
socket.emit('join_shop', shopId);
socket.on('queue_updated', ({ queue }) => setQueue(queue));

// Patient page — listen for your status
socket.emit('join_entry', entryId);
socket.on('status_updated', ({ message }) => alert(message));
```

---

## QR Code Flow

1. Admin calls `GET /api/queue/qr/:shopId` → receives `{ qrUrl: "http://frontend/join/shopId" }`
2. Frontend generates QR image from `qrUrl` (use `qrcode` npm package or `react-qr-code`)
3. Patient scans QR → opens `http://frontend/join/:shopId` → fills name → calls `POST /api/queue/join`
4. Patient receives `entryId` & `tokenNumber` → subscribes to Socket.IO for live position

---

## Project Structure

```
Backend/
├── server.js               ← HTTP + Socket.IO server entry point
├── package.json
└── src/
    ├── app.js              ← Express app (routes, middleware)
    ├── .env
    ├── config/
    │   └── db.js           ← MongoDB connection
    ├── models/
    │   ├── User.js         ← User schema (admin / user)
    │   └── Queue.js        ← Queue schema (auto position & token)
    ├── controllers/
    │   ├── authController.js
    │   └── queueController.js
    ├── routes/
    │   ├── authroutes.js
    │   └── queueroutes.js
    └── middleware/
        └── authmiddleware.js ← JWT verification
```
