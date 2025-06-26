# Portal Server Backend 📘

A robust Node.js/Express backend server with MongoDB integration, supporting authentication, ticket management, and third-party integrations (Freshdesk & HubSpot).

## 🚀 Live Demo

**Hosted Link:** [https://portal-server-fg1n.onrender.com](https://portal-server-fg1n.onrender.com)

**Repository:** [https://github.com/vijayakumar1069/portal-server.git](https://github.com/vijayakumar1069/portal-server.git)

## 🛠️ Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** Helmet, CORS, Rate Limiting
- **Validation:** Express Validator
- **Password Hashing:** bcryptjs

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Git

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/vijayakumar1069/portal-server.git
cd portal-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/portal-db
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/portal-db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URLs (for CORS)
FRONTEND_URL=http://localhost:3000
FRONTEND_PRODUCTION_URL=https://your-frontend-domain.com
```

### 4. Build and Run

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm run build
npm start
```

## 🔐 API Credentials Setup

### MongoDB Setup

**Option 1: Local MongoDB**
1. Install MongoDB locally
2. Start MongoDB service
3. Use `MONGODB_URI=mongodb://localhost:27017/portal-db`

**Option 2: MongoDB Atlas (Recommended)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string
4. Replace `MONGODB_URI` in `.env` file

### JWT Secret Generation

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🔗 Third-Party Integrations

### Freshdesk Integration

To integrate with Freshdesk:

1. Get your Freshdesk API credentials:
   - Freshdesk Domain: `company.freshdesk.com`
   - API Key: Available in Profile Settings → API Key

2. Use the integration endpoint:
   ```
   POST /api/integration/freshdesk-save
   ```

### HubSpot Integration

To integrate with HubSpot:

1. Get your HubSpot API credentials:
   - Access Token: Available in HubSpot Developer Account

2. Use the integration endpoint:
   ```
   POST /api/integration/hubSpot-save
   ```

## 📡 Webhook Configuration

### Freshdesk Webhook Setup

1. **Login to Freshdesk Admin Panel**
2. **Navigate to:** Admin → Workflows → Automations
3. **Create New Rule:** 
   - Trigger: When ticket is created/updated
   - Action: Send HTTP Request

4. **Webhook Configuration:**
   ```
   URL: https://portal-server-fg1n.onrender.com/api/webhooks/freshdesk
   Method: POST
   Content Type: application/json
   ```

5. **Webhook Payload Example:**
   ```json
   {
     "ticket_id": "{{ticket.id}}",
     "ticket_subject": "{{ticket.subject}}",
     "ticket_status": "{{ticket.status}}",
     "requester_email": "{{ticket.requester.email}}"
   }
   ```
## 👤 Sample User Credentials

For testing purposes, you can create users via the signup endpoint or use these sample credentials after manual creation:

**Sample User 1:**
```json
{
  "email": "vijay@gmail.com",
  "password": "Vijay@123"
}
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/logout` - User logout (requires auth)

### Integration Management
- `POST /api/integration/freshdesk-save` - Save Freshdesk credentials
- `POST /api/integration/hubSpot-save` - Save HubSpot credentials
- `GET /api/integration/status` - Get integration status

### Ticket Management
- `GET /api/tickets` - Get all tickets
- `GET /api/tickets/:ticketId` - Get specific ticket details
- `GET /api/tickets/:ticketId/contact` - Get ticket contact info

### Webhooks
- `POST /api/webhooks/freshdesk` - Freshdesk webhook endpoint
- `GET /api/webhooks/logs` - Get webhook logs (requires auth)

### Health Check
- `GET /health` - Server health status

## 🔧 Project Structure

```
src/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── auth.controller.js   # Authentication logic
│   ├── integration.controller.js # Integration management
│   ├── ticket.controller.js # Ticket operations
│   └── webhook.controller.js # Webhook handling
├── middleware/
│   ├── auth.js             # JWT authentication
│   └── validation.js       # Input validation
├── routes/
│   ├── auth.js            # Auth routes
│   ├── integration.js     # Integration routes
│   ├── tickets.js         # Ticket routes
│   └── webHooks.js        # Webhook routes
└── index.ts               # Main server file
```

## 🚦 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality

## 🔒 Security Features

- **Helmet:** Sets security headers
- **CORS:** Configured for specific origins
- **Rate Limiting:** 100 requests per 15 minutes per IP
- **Input Validation:** Express Validator for request validation
- **JWT Authentication:** Secure token-based authentication
- **Password Hashing:** bcryptjs for secure password storage

## 🌍 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/portal-db` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `FRONTEND_URL` | Frontend URL (dev) | `http://localhost:3000` |
| `FRONTEND_PRODUCTION_URL` | Frontend URL (prod) | `https://yourdomain.com` |

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check if MongoDB is running
   - Verify MONGODB_URI in .env file
   - Ensure network access for MongoDB Atlas

2. **CORS Errors**
   - Verify FRONTEND_URL in .env file
   - Check if frontend origin is allowed

3. **JWT Token Issues**
   - Ensure JWT_SECRET is set
   - Check token expiration time

4. **Webhook Not Working**
   - Verify webhook URL is accessible
   - Check webhook payload format
   - Review webhook logs via `/api/webhooks/logs`


**Built with ❤️ using Node.js, Express, and MongoDB**
