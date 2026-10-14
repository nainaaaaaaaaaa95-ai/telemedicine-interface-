# QUICK START GUIDE
## Getting Your Healthcare Telemedicine App Running

**⏱️ Time to Get Running: 5 minutes**

---

## STEP 1: Install Dependencies (1 minute)

```bash
cd backend
npm install
```

**What gets installed:**
- ✅ Express (web framework)
- ✅ MongoDB (database driver)
- ✅ JWT (authentication)
- ✅ Bcrypt (password hashing)
- ✅ CORS (cross-origin requests)
- ✅ Rate limiting & caching
- ✅ Compression

---

## STEP 2: Verify .env File (1 minute)

Check that `backend/.env` exists with:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/mega_project
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_minimum_32_characters_long
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
API_BASE_URL=http://localhost:5000
LOG_LEVEL=info
```

If missing, create it. If you changed MongoDB connection, update the `MONGODB_URI`.

---

## STEP 3: Start MongoDB

```bash
# Windows (if MongoDB is installed)
mongod

# Or use MongoDB Atlas (cloud):
# Update MONGODB_URI in .env to your MongoDB Atlas connection string
```

---

## STEP 4: Start the Backend Server (1 minute)

```bash
cd backend
npm run dev
```

**Expected Output:**
```
✅ MongoDB Connected
✅ Server running on port 5000
Environment: development
```

---

## STEP 5: Test the API (2 minutes)

Open a new terminal and test signup:

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Test@1234",
    "passwordConfirm": "Test@1234",
    "role": "patient"
  }'
```

**Expected Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

---

## TESTING THE APPLICATION

### Option 1: Using Frontend (Recommended)

1. Open browser: `http://localhost:3000/frontend/html/signup.html`
2. Create account
3. Login at `http://localhost:3000/frontend/html/login.html`
4. Book appointment at `http://localhost:3000/frontend/html/appoinment.html`

### Option 2: Using Postman

**1. Signup**
```
POST http://localhost:5000/api/auth/signup
Content-Type: application/json

{
  "name": "Dr. Smith",
  "email": "doctor@example.com",
  "password": "Doctor@1234",
  "passwordConfirm": "Doctor@1234",
  "role": "doctor"
}
```

**2. Login**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "doctor@example.com",
  "password": "Doctor@1234"
}
```

Save the `token` from response.

**3. Get User Profile**
```
GET http://localhost:5000/api/auth/me
Authorization: Bearer <YOUR_TOKEN>
```

---

## PASSWORD REQUIREMENTS

Strong passwords must have:
- ✅ At least 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (!@#$%^&*(),.?":{}|<>)

**Examples:**
- ✅ Test@1234
- ✅ Password!2024
- ✅ MyApp#2026

**Invalid:**
- ❌ password (no uppercase, number, special)
- ❌ Test@123 (too short)
- ❌ TEST@1234 (no lowercase)

---

## COMMON ISSUES & SOLUTIONS

### Issue 1: "MongoDB connection failed"
```
Error: Cannot connect to mongodb://127.0.0.1:27017/mega_project
```

**Solution:**
- Start MongoDB: `mongod`
- Or use MongoDB Atlas (cloud database)
- Update `MONGODB_URI` in `.env`

### Issue 2: "Cannot find module 'express-rate-limit'"
```
Error: Module not found
```

**Solution:**
```bash
npm install express-rate-limit node-cache compression
```

### Issue 3: "Port 5000 already in use"
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Change PORT in .env to 5001, or:
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9
```

### Issue 4: "CORS error from frontend"
```
Error: Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
- Verify `FRONTEND_URL` and `CORS_ORIGIN` in `.env`
- Default: `http://localhost:3000`
- API is on `http://localhost:5000`

### Issue 5: "Invalid token" error
```
Error: Invalid token | Token has expired
```

**Solution:**
- Re-login to get new token
- Tokens expire after 24 hours
- Frontend automatically stores token in localStorage

---

## API ENDPOINTS QUICK REFERENCE

### Authentication
```
POST   /api/auth/signup      - Register new user
POST   /api/auth/login       - Login and get token
POST   /api/auth/logout      - Logout (client-side only)
GET    /api/auth/me          - Get current user profile
```

### Appointments
```
POST   /api/appointments/book             - Book appointment
GET    /api/appointments/my               - Get my appointments
GET    /api/appointments/doctor           - Get doctor's appointments
GET    /api/appointments/:id              - Get appointment details
PATCH  /api/appointments/:id/status       - Update status
DELETE /api/appointments/:id              - Cancel appointment
```

---

## FILE STRUCTURE

```
mega project/
├── backend/
│   ├── .env                           # ✅ Configuration
│   ├── .env.example                   # ✅ Template
│   ├── server.js                      # ✅ Main server
│   ├── app.js                         # Unused (can delete)
│   ├── middleware/
│   │   ├── authMiddleware.js          # ✅ Updated
│   │   ├── cacheMiddleware.js         # ✅ NEW
│   │   └── rateLimitMiddleware.js     # ✅ NEW
│   ├── routes/
│   │   ├── authroutes.js              # ✅ Updated
│   │   ├── appointmentroutes.js       # ✅ Updated
│   │   ├── patientroutes.js
│   │   ├── doctorroutes.js
│   │   └── prescriptionRoutes.js
│   ├── controllers/
│   ├── models/
│   ├── config/
│   └── utils/
│       └── validators.js              # ✅ NEW
├── frontend/
│   ├── html/
│   │   ├── login.html                 # ✅ Updated
│   │   ├── signup.html                # ✅ Updated
│   │   ├── appoinment.html            # ✅ Updated
│   │   └── ...
│   ├── js/
│   │   ├── login.js                   # ✅ Updated
│   │   ├── signup.js                  # ✅ Updated
│   │   ├── appoinment.js              # ✅ Updated
│   │   └── ...
│   └── css/
└── TECHNICAL_ANALYSIS_REPORT.md       # Full analysis
└── IMPLEMENTATION_SUMMARY.md          # What was implemented
└── QUICK_START_GUIDE.md               # This file
```

---

## DEVELOPMENT TIPS

### Enable Debug Logging
```javascript
// In your JavaScript files
console.log("API Response:", data);
console.log("Token:", localStorage.getItem("token"));
```

### Test Frontend Without Backend
```javascript
// Use sample data for development
const sampleDoctors = [
  { _id: "1", name: "Dr. Smith", specialization: "Cardiologist" },
  { _id: "2", name: "Dr. Johnson", specialization: "Dentist" }
];
```

### Check MongoDB Data
```bash
# Open MongoDB shell
mongosh

# Switch to database
use mega_project

# Check collections
show collections

# View users
db.users.find().pretty()

# View appointments
db.appointments.find().pretty()
```

### View Browser Console Errors
1. Open browser DevTools (F12)
2. Go to Console tab
3. Check for errors in red
4. Network tab shows API calls

---

## WHAT'S BEEN FIXED

| Issue | Status | Impact |
|-------|--------|--------|
| Hardcoded secrets | ✅ Fixed | Security ⬆️ |
| No API calls | ✅ Fixed | Functionality ⬆️ |
| Broken auth | ✅ Fixed | Security ⬆️ |
| Input validation | ✅ Fixed | Data quality ⬆️ |
| Error handling | ✅ Fixed | UX ⬆️ |
| CORS issues | ✅ Fixed | Integration ⬆️ |
| Rate limiting | ✅ Fixed | Security ⬆️ |

---

## NEXT STEPS

### After Getting It Running:
1. ✅ Test signup with invalid password
2. ✅ Test login with wrong credentials
3. ✅ Book an appointment
4. ✅ Check appointment list
5. ✅ Test logout

### Before Production:
1. Change `JWT_SECRET` to random string
2. Set `NODE_ENV=production`
3. Enable HTTPS
4. Set up proper error logging
5. Run security audit
6. Add unit tests
7. Add integration tests

### Additional Features to Add:
1. Email verification
2. Password reset
3. Doctor profile endpoints
4. Prescription management
5. Video consultation
6. Appointment reminders
7. User notifications

---

## HELP & SUPPORT

### Check Logs
```bash
# Terminal where server is running shows:
✅ MongoDB Connected
✅ Server running on port 5000

# Check for errors in red
```

### Check Network Requests
1. Open DevTools (F12)
2. Network tab
3. Make request
4. Click request
5. Check Response tab for errors

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Email already registered" | User exists | Use different email |
| "Invalid credentials" | Wrong email/password | Check spelling |
| "Invalid token" | Expired or malformed | Re-login |
| "Access denied" | Wrong role | Use correct role |
| "Doctor not found" | Invalid doctor ID | Select valid doctor |

---

**You're all set! 🎉**

Run the server with `npm run dev` and test the API!

For detailed technical information, see `TECHNICAL_ANALYSIS_REPORT.md`
For implementation details, see `IMPLEMENTATION_SUMMARY.md`
