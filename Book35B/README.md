# Appointment Booking API

A production-shaped backend for an appointment booking platform, built with **Node.js**,
**Express**, and **MongoDB (Mongoose)**. Providers publish their services and weekly
availability; customers book conflict-free appointments.

## Tech stack

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Runtime    | Node.js 18+                                                   |
| Framework  | Express 4                                                     |
| Database   | MongoDB via Mongoose                                          |
| Auth       | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`                  |
| Validation | Joi                                                           |
| Security   | Helmet, express-rate-limit, express-mongo-sanitize, hpp, CORS |
| Logging    | Winston + Morgan                                              |
| Testing    | Jest, Supertest                                               |




Appointment Booking App - Backend

This is the backend part of a full-stack Appointment Booking Application.

The backend is responsible for handling the application's data, business logic, authentication, and communication with the database.

It provides APIs that the frontend can use to register users, log users in, manage services, check availability, and create and manage appointments.



What Does This Backend Do?

The backend acts as the middleman between the frontend and the database.

For example:

```text
Frontend
   |
   | Request
   v
Backend
   |
   | Request
   v
Database
   |
   | Data
   v
Backend
   |
   | Response
   v
Frontend
```

For example, when a user wants to book an appointment:

```text
User
  |
  v
Frontend
  |
  | "I want to book 10:00 AM"
  v
Backend
  |
  | Check availability
  v
Database
  |
  | 10:00 AM is available
  v
Backend
  |
  | Save appointment
  v
Database
  |
  v
Backend
  |
  | Booking successful
  v
Frontend
```



Features

The backend provides the following features:

* User registration
* User login
* User authentication
* User profile management
* Service management
* Appointment booking
* Appointment management
* Appointment cancellation
* Appointment rescheduling
* Availability management
* Admin management
* Data validation
* Error handling



Technologies Used

This backend is built with:

* Node.js
* Express.js
* MongoDB
* Mongoose
* JavaScript
* JSON Web Token (JWT)
* bcrypt
* dotenv



PROJECT STRUCTURE

The backend is organized into different folders.

```text
backend/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── serviceController.js
│   ├── appointmentController.js
│   └── availabilityController.js
│
├── middleware/
│   ├── authMiddleware.js
│   └── errorMiddleware.js
│
├── models/
│   ├── User.js
│   ├── Service.js
│   ├── Appointment.js
│   └── Availability.js
│
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── serviceRoutes.js
│   ├── appointmentRoutes.js
│   └── availabilityRoutes.js
│
├── services/
│   └── appointmentService.js
│
├── utils/
│   └── generateToken.js
│
├── .env
├── .gitignore
├── app.js
├── server.js
├── package.json
└── README.md
```



Understanding the Folders


1. config

The `config` folder contains configuration files.

For example:

```text
config/
└── db.js
```

`db.js` is responsible for connecting the backend to MongoDB.


2. controllers

The `controllers` folder contains the main logic for the application's requests.

For example:

```text
controllers/
└── appointmentController.js
```

The appointment controller can contain functions for:

* Creating an appointment
* Getting appointments
* Updating appointments
* Cancelling appointments

Controllers answer the question:

> "What should the application do when this request arrives?"



3. middleware

Middleware contains functions that run between the request and the final response.

For example:

```text
middleware/
└── authMiddleware.js
```

The authentication middleware can check:

> "Is this user logged in?"

If the user is authenticated, the request can continue.

If not, the backend can reject the request.



4. models

The `models` folder describes the structure of the data stored in the database.

Example:

```text
models/
├── User.js
├── Service.js
├── Appointment.js
└── Availability.js
```


User

Stores information about users.

Example:

```text
Name
Email
Password
Role
```


Service

Stores information about services.

Example:

```text
Service Name
Description
Price
Duration
```


Appointment

Stores information about bookings.

Example:

```text
User
Service
Date
Time
Status
```


Availability

Stores available dates and times.

Example:

```text
Date
Start Time
End Time
```



5. Routes

Routes determine the URLs that the frontend can communicate with.

Example:

```text
routes/
├── authRoutes.js
├── userRoutes.js
├── serviceRoutes.js
├── appointmentRoutes.js
└── availabilityRoutes.js
```

For example:

```text
POST /api/auth/register
```

means:

> "Create a new user."

And:

```text
POST /api/appointments
```

means:

> "Create a new appointment."



6. Services

The `services` folder contains reusable business logic.

For example:

```text
services/
└── appointmentService.js
```

This can contain more complicated appointment-related operations.

For example:

```text
Check if time is available
        ↓
Check if appointment already exists
        ↓
Create appointment
        ↓
Return appointment
```



7. Utils

The `utils` folder contains small helper functions that can be reused throughout the application.

For example:

```text
utils/
└── generateToken.js
```

This file can contain a function that generates a JWT token for authenticated users.



8. app.js

`app.js` is responsible for setting up the Express application.

It can contain:

* Express configuration
* Middleware
* Routes
* Error handling

Example:

```text
Express App
    |
    ├── Middleware
    |
    ├── Routes
    |
    └── Error Handling
```



9. server.js

`server.js` starts the backend server.

For example:

```text
server.js
   |
   v
Connect to Database
   |
   v
Start Express Server
   |
   v
Listen on Port
```

The server might run on:

```text
http://localhost:5000
```



API Endpoints

The backend provides different API endpoints.


Authentication


Register

```text
POST /api/auth/register
```

Creates a new user.

Example request:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```



Login

```text
POST /api/auth/login
```

Logs a user into the application.

Example:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```



Get Current User

```text
GET /api/auth/me
```

Returns information about the currently logged-in user.



User Endpoints


Get All Users

```text
GET /api/users
```

Returns all users.



Get One User

```text
GET /api/users/:id
```

Returns one user using their ID.



Update User

```text
PUT /api/users/:id
```

Updates a user's information.



Delete User

```text
DELETE /api/users/:id
```

Deletes a user.



Service Endpoints


Get All Services

```text
GET /api/services
```

Returns all available services.



Get One Service

```text
GET /api/services/:id
```

Returns information about one service.



Create Service

```text
POST /api/services
```

Creates a new service.

Example:

```json
{
  "name": "Medical Consultation",
  "description": "General medical consultation",
  "price": 5000,
  "duration": 30
}
```



Delete Service

```text
PUT /api/services/:id
```

Updates an existing service.



Delete Service

```text
DELETE /api/services/:id
```

Deletes a service.



Appointment Endpoints


Create Appointment

```text
POST /api/appointments
```

Creates a new appointment.

Example:

```json
{
  "serviceId": "12345",
  "date": "2026-10-15",
  "time": "10:00"
}
```



Get Appointments

```text
GET /api/appointments
```

Returns appointments.



Get One Appointment

```text
GET /api/appointments/:id
```

Returns a specific appointment.



Update Appointment

```text
PUT /api/appointments/:id
```

Updates an appointment.



Cancel Appointment

```text
DELETE /api/appointments/:id
```

Cancels an appointment.



Availability Endpoints


Get Available Times

```text
GET /api/availability
```

Returns available appointment dates and times.



Create Availability

```text
POST /api/availability
```

Creates an available date and time.

Example:

```json
{
  "date": "2026-10-15",
  "startTime": "09:00",
  "endTime": "17:00"
}
```



Update Availability

```text
PUT /api/availability/:id
```

Updates an availability record.



Delete Availability

```text
DELETE /api/availability/:id
```

Removes an available time.



Database

This application uses MongoDB as its database.

The database stores:

```text
Users
Services
Appointments
Availability
```

The backend communicates with MongoDB through Mongoose.

The basic connection looks like:

```text
Backend
   |
   v
Mongoose
   |
   v
MongoDB
```



Authentication

Authentication allows the backend to know who is using the application.

The authentication process is:

```text
User Registers
      |
      v
Password Is Hashed
      |
      v
User Is Saved
      |
      v
User Logs In
      |
      v
Credentials Are Checked
      |
      v
JWT Token Is Created
      |
      v
Token Is Sent To Frontend
```

Protected routes can then use the token to identify the user.



Environment Variables

Create a `.env` file inside the backend folder.

Example:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key
```

The `.env` file contains private information.

Do not upload it to GitHub.

Add this to `.gitignore`:

```text
.env
node_modules
```



Installation


Step 1: Clone the Project

```bash
git clone https://github.com/yourusername/appointment-booking-app.git
```


Step 2: Enter the Backend Folder

```bash
cd appointment-booking-app/backend
```


Step 3: Install Dependencies

```bash
npm install
```


Step 4: Create the Environment File

Create:

```text
.env
```

Then add:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```



Running the Backend

To start the backend in development mode:

```bash
npm run dev
```

Or, if the project does not have a development script:

```bash
node server.js
```

The server should then run on:

```text
http://localhost:5000
```



Testing the API

You can test the backend using:

* Postman
* Thunder Client
* Insomnia

For example, you can test:

```text
POST /api/auth/register
POST /api/auth/login
GET /api/services
POST /api/appointments
GET /api/appointments
```



Appointment Booking Logic

Before creating an appointment, the backend should check whether the selected time is available.

The process should be:

```text
User Selects Date
       |
       v
User Selects Time
       |
       v
Backend Receives Request
       |
       v
Check Availability
       |
       v
Is Time Available?
       |
   +---+---+
   |       |
  YES      NO
   |       |
   v       v
Create    Reject
Booking   Booking
   |
   v
Save Appointment
```

This prevents two users from booking the same time slot.



Error Handling

The backend should return clear error messages when something goes wrong.

Examples:

```json
{
  "message": "User not found"
}
```

or:

```json
{
  "message": "This appointment time is already booked"
}
```

or:

```json
{
  "message": "Unauthorized"
}
```



Security

The backend should protect user information and application data.

Important security practices include:

* Hash passwords using bcrypt.
* Use JWT for authentication.
* Protect private routes.
* Validate user input.
* Protect admin-only routes.
* Store secrets in `.env`.
* Never store plain-text passwords.
* Never upload `.env` to GitHub.
* Prevent duplicate appointment bookings.

---


Future Improvements

The backend can later be improved by adding:

* Email notifications
* SMS notifications
* Appointment reminders
* Online payment
* Google Calendar integration
* Multiple service providers
* Multiple locations
* Reviews and ratings
* Admin analytics
* Recurring appointments
* Video consultations

---


Author

**Your Name**..... Group's Name?

Full-Stack Developer

---


Project Goal

The goal of this backend is to provide a secure and organized API for an appointment booking application.

The backend allows the frontend to communicate with the database and provides the logic needed to manage:

* Users
* Services
* Availability
* Appointments
* Authentication

---


License

This project is created for learning and development purposes.
