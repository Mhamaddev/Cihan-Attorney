# ⚖️ Lawyer Case Management System

A comprehensive case management system built with the PERN stack (PostgreSQL, Express, React, Node.js) designed specifically for lawyers to manage their cases, clients, court dates, expenses, and documentation.

## 🌟 Features

### Case Management
- **Create & Edit Cases**: Full CRUD operations for case management
- **Case Status Tracking**: Monitor case progress (Active, Pending, Closed)
- **Request Type Classification**: Categorize cases by type
- **Court Call Tracking**: Flag cases called for court

### Party Management
- **Applicant Information**: Store client details (name, phone, address)
- **Wanted/Defendant Information**: Track opposing party details
- **Comprehensive Contact Info**: Maintain all necessary contact information

### Court Dates
- **Multiple Interview Dates**: Schedule and track court appearances
- **Date & Time Management**: Full datetime support for court sessions
- **Notes & Comments**: Add contextual information for each court date
- **Easy Addition/Deletion**: Manage court dates throughout case lifecycle

### Expense Tracking
- **Detailed Expense Records**: Track all case-related expenses
- **Automatic Total Calculation**: Real-time expense summation
- **Date-based Organization**: Sort and filter by expense date
- **Notes Support**: Add context to each expense

### Document Management
- **File Upload System**: Secure file storage for case documents
- **Category-based Organization**:
  - Evidence attachments
  - Court call for wanted
  - Decision documents
  - Personal information
  - Other documents
- **Multiple File Format Support**: PDF, DOC, DOCX, images, and more
- **Download & Delete**: Full file management capabilities

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **Multer** - File upload handling
- **pg** - PostgreSQL client

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **React Router** - Client-side routing
- **Modern CSS** - Custom responsive design

## 🚀 Quick Start

See [QUICKSTART.md](QUICKSTART.md) for a fast setup guide.

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- npm or yarn

### Basic Setup

1. **Create Database**
   ```sql
   CREATE DATABASE lawyer_db;
   ```

2. **Configure Backend** - Edit `backend/.env`:
   ```env
   DB_PASSWORD=your_actual_password
   ```

3. **Install & Run**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm install
   npm run dev

   # Frontend (Terminal 2)
   cd frontend
   npm install
   npm run dev
   ```

4. **Access**: http://localhost:5173

## 📊 Database Schema

The system uses 6 main tables:
- `cases` - Main case information
- `applicants` - Client/applicant details
- `wanted` - Defendant/wanted party details
- `court_dates` - Court appearance schedules
- `expenses` - Case expense tracking
- `case_files` - Document attachments

All tables are created automatically on first backend startup.

## 🔌 API Endpoints

### Cases
- `GET /api/cases` - List all cases
- `GET /api/cases/:id` - Get case details
- `POST /api/cases` - Create case
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case

### Court Dates
- `POST /api/cases/:id/court-dates` - Add court date
- `DELETE /api/cases/:id/court-dates/:courtDateId` - Delete

### Expenses
- `POST /api/cases/:id/expenses` - Add expense
- `DELETE /api/cases/:id/expenses/:expenseId` - Delete

### Files
- `POST /api/cases/:id/files` - Upload file
- `DELETE /api/cases/:id/files/:fileId` - Delete file

## 🎨 UI Features

- Responsive design for all devices
- Clean, professional interface
- Color-coded status indicators
- Real-time validation
- Intuitive navigation
- Modern card-based layout

## 📝 Usage Guide

### Creating a Case
1. Click "New Case"
2. Enter request type
3. Fill applicant & wanted information
4. Submit

### Adding Court Dates
1. Open case details
2. Click "+ Add Court Date"
3. Select date/time and add notes

### Managing Expenses
1. Navigate to case
2. Click "+ Add Expense"
3. View automatic total

### Uploading Files
1. Open case
2. Click "+ Upload File"
3. Select file and category

## 🐛 Troubleshooting

**Database Connection Error**
- Check PostgreSQL is running
- Verify credentials in `.env`
- Ensure database exists

**Port Already in Use**
```bash
npx kill-port 5000  # Backend
npx kill-port 5173  # Frontend
```

**File Upload Issues**
- Check max file size (10MB)
- Verify allowed file types
- Ensure uploads folder exists

## 📄 License

ISC License

---

**Built with ❤️ for legal professionals | ⚖️**
