# Vajra 2025-26 Sports Management System

A comprehensive web-based sports management system for the School of Engineering Annual Sports Meet, featuring real-time point tracking, admin management capabilities, and a stunning modern UI with glassmorphism effects and smooth animations.

## Features

### Public Interface
- 🏆 **Live Point Table** - Real-time department rankings with auto-refresh
- 📅 **Event Schedules** - View all scheduled events with date, time, and venue
- 🏅 **Results Display** - See event results organized by event
- 🎖️ **Winners Gallery** - Photo gallery of event winners
- 📸 **Event Photos** - Browse photos from various sports events
- 🎨 **Premium UI** - Modern design with gradients, glassmorphism, and animations

### Admin Dashboard
- 🔐 **Secure Authentication** - Session-based admin login
- 🏢 **Department Management** - Add and manage participating departments
- 🏆 **Event Management** - Configure events with custom point allocations
- 📅 **Schedule Management** - Create event schedules
- 🏅 **Result Entry** - Enter results with automatic point calculation
- 📷 **Media Upload** - Upload winner and event photos
- 📊 **Auto Point Calculation** - Automatic department ranking updates

## Technology Stack

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - Database ORM
- **SQLite** - Lightweight database
- **Flask-CORS** - Cross-origin support
- **Werkzeug** - Security utilities

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with custom properties
- **Vanilla JavaScript** - No framework dependencies
- **Responsive Design** - Mobile-friendly interface

## Installation & Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 2: Run the Application

```bash
python app.py
```

The application will start on `http://localhost:5000`

### Step 3: Access the System

- **Public Interface**: `http://localhost:5000/`
- **Admin Login**: `http://localhost:5000/admin`

### Default Admin Credentials

```
Username: admin
Password: admin123
```

> ⚠️ **IMPORTANT**: Change these credentials in production by modifying the default admin creation in `app.py`

## Project Structure

```
vajra_points/
├── app.py                      # Flask application & API
├── requirements.txt            # Python dependencies
├── database.db                 # SQLite database (auto-generated)
├── templates/
│   ├── index.html             # Public interface
│   ├── admin_login.html       # Admin login page
│   └── admin_dashboard.html   # Admin dashboard
├── static/
│   ├── css/
│   │   ├── style.css          # Public interface styles
│   │   └── admin.css          # Admin dashboard styles
│   ├── js/
│   │   ├── main.js            # Public interface logic
│   │   └── admin.js           # Admin dashboard logic
│   └── uploads/               # Uploaded images
└── README.md                  # This file
```

## Database Schema

### Tables

1. **Admin** - Admin user credentials
2. **Department** - Participating departments with points and rankings
3. **Event** - Sports events with point allocations
4. **Schedule** - Event schedules with date, time, and venue
5. **Result** - Event results linking departments and events
6. **Media** - Uploaded images for winners and events

## Usage Guide

### For Administrators

1. **Login** - Access admin dashboard at `/admin`
2. **Add Departments** - Create all participating departments first
3. **Add Events** - Configure sports events with point distributions
4. **Create Schedules** - Schedule events with venues and timings
5. **Enter Results** - Add competition results (points auto-calculated)
6. **Upload Media** - Add winner photos and event galleries

### For Public Users

1. **View Point Table** - See live department rankings
2. **Check Schedules** - Browse upcoming events
3. **See Results** - View declared results
4. **Gallery** - Explore winner and event photos
5. **Auto-Refresh** - Data updates every 30 seconds automatically

## API Endpoints

### Public Endpoints
- `GET /api/departments` - Get all departments with points
- `GET /api/events` - Get all events
- `GET /api/schedules` - Get all schedules
- `GET /api/results` - Get all results
- `GET /api/media` - Get all media

### Admin Endpoints (Authentication Required)
- `POST /admin/login` - Admin login
- `POST /admin/logout` - Admin logout
- `GET /admin/check` - Check authentication status
- `POST /api/departments` - Add department
- `PUT /api/departments/<id>` - Update department
- `DELETE /api/departments/<id>` - Delete department
- `POST /api/events` - Add event
- `DELETE /api/events/<id>` - Delete event
- `POST /api/schedules` - Add schedule
- `DELETE /api/schedules/<id>` - Delete schedule
- `POST /api/results` - Add result
- `DELETE /api/results/<id>` - Delete result
- `POST /api/media` - Upload image
- `DELETE /api/media/<id>` - Delete image

## Design Features

- **Glassmorphism** - Frosted glass effects with backdrop filters
- **Gradient Themes** - Vibrant purple-to-blue color palette
- **Smooth Animations** - Fade-in, slide-in, and hover effects
- **Micro-interactions** - Button hovers, card lifts, transitions
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Auto-updates** - Real-time data refresh every 30 seconds

## Security Notes

For production deployment:

1. Change the `SECRET_KEY` in `app.py`
2. Update default admin credentials
3. Use HTTPS for secure connections
4. Consider migrating to PostgreSQL/MySQL for better concurrency
5. Implement rate limiting for API endpoints
6. Add file upload validation and size limits

## Troubleshooting

**Database not created:**
- The database is auto-created when you run `python app.py`
- Check for write permissions in the project directory

**Images not displaying:**
- Ensure `static/uploads/` directory exists
- Check file upload permissions

**CORS errors:**
- Flask-CORS is configured to handle cross-origin requests
- Check browser console for specific errors

**Session issues:**
- Clear browser cookies and try again
- Ensure cookies are enabled

## Future Enhancements

- Live scoring with WebSocket support
- Mobile app integration
- Multi-sport season management
- Statistical analytics and reports
- Email notifications for results
- Player registration system
- Export data to PDF/Excel

## License

This project is created for the School of Engineering Annual Sports Meet Vajra 2025-26.

## Support

For issues or questions, contact the sports coordinators or development team.

---

**Vajra 2025-26** - Making sports management efficient and engaging! 🏆
