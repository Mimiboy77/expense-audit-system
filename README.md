# Internal Audit & Expense Approval System

A web-based expense management and approval platform built for SMEs in Nigeria.
Built with Node.js, Express, MongoDB, and EJS.

## Features

- JWT authentication stored in HttpOnly cookies
- Role-based access control (Employee, Manager, Finance)
- Multi-level approval workflow with ₦50,000 threshold rule
- Receipt file uploads via Multer
- Immutable audit logs with performer tracking
- Monthly CSV report generation
- Departmental budget tracking with monthly resets
- Email notifications via Nodemailer
- Scheduled cron jobs for budget resets and approval reminders
- Winston logging to file and terminal

## Roles and Access

| Feature              | Employee | Manager | Finance |
|----------------------|----------|---------|---------|
| Submit expenses      | ✅       | ✅      | ✅      |
| View own expenses    | ✅       | ✅      | ✅      |
| Approve expenses     | ❌       | ✅      | ✅      |
| View audit logs      | ❌       | ❌      | ✅      |
| Generate reports     | ❌       | ❌      | ✅      |
| View department budget | ❌     | ✅      | ✅      |

## Approval Workflow

- Expenses below ₦50,000 → Manager approval only
- Expenses ₦50,000 and above → Manager approval + Finance approval

## Setup

1. Clone the repository
2. Install dependencies

   npm install

3. Create a .env file in the root and add the following

   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password

4. Create the uploads folder

   mkdir -p public/uploads

5. Create the logs folder

   mkdir logs

6. Start the development server

   npm run dev

## Deployment

This project is configured for deployment on Render.
Set all .env variables in the Render dashboard under Environment Variables.
Set the start command to: node server.js

## Tech Stack

- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Templating: EJS
- Authentication: JWT with bcryptjs
- File Uploads: Multer
- Email: Nodemailer
- Scheduling: node-cron
- Logging: Winston
- Reports: csv-writer
EMPLOYEE
  ↓ submits expense
  ↓ ALL managers in their dept get email notification
  ↓ can view own expenses only
  ↓ receives email when decision is made

MANAGER (one or two in same dept)
  ↓ sees pending expenses < ₦50,000 from their dept only
  ↓ cannot see expenses from other departments
  ↓ cannot approve expenses >= ₦50,000
  ↓ if two managers — both see the pending expense
  ↓ whichever one acts first locks it — second sees it gone
  ↓ if approved expense >= ₦50,000 — ALL finance users notified

FINANCE (one or two)
  ↓ sees all pending expenses >= ₦50,000 across all departments
  ↓ cannot approve expenses < ₦50,000
  ↓ if two finance users — both see the pending expense
  ↓ whichever one acts first locks it — second sees it gone
  ↓ employee notified of final decision