from flask import Flask, request, jsonify, session, render_template, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import cloudinary
import cloudinary.uploader

# Cloudinary Configuration
cloudinary.config(
    cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key = os.environ.get('CLOUDINARY_API_KEY'),
    api_secret = os.environ.get('CLOUDINARY_API_SECRET')
)

app = Flask(__name__)
# Secure fallback for Secret Key (Render creates an empty env var by default, so we need 'or')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'vajra-sports-2025-26-secret-key'
# Database configuration
# Check for DATABASE_URL (Render) or POSTGRES_URL (Vercel/General)
db_url = os.environ.get('DATABASE_URL') or os.environ.get('POSTGRES_URL')

if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# If running on Render, ENFORCE Postgres. Do not allow silent fallback to SQLite.
# If running on Render, ENFORCE Postgres. Do not allow silent fallback to SQLite.
if os.environ.get('RENDER') and not db_url:
    raise RuntimeError("DATABASE_URL is missing on Render! Check your environment variables.")

app.config['SQLALCHEMY_DATABASE_URI'] = db_url or 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

db = SQLAlchemy(app)
CORS(app, supports_credentials=True)

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Database Models
class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)

class Department(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    total_points = db.Column(db.Integer, default=0)
    rank = db.Column(db.Integer, default=0)

class Result(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_name = db.Column(db.String(100), nullable=False)
    event_type = db.Column(db.String(20), nullable=False)  # mens, womens, team, individual
    department_id = db.Column(db.Integer, db.ForeignKey('department.id'), nullable=False)
    position = db.Column(db.Integer, nullable=False)  # 1, 2, or 3
    points_awarded = db.Column(db.Integer, nullable=False)
    date = db.Column(db.String(20), nullable=True)  # Optional event date
    venue = db.Column(db.String(100), nullable=True)  # Optional venue
    department = db.relationship('Department', backref='results')

class Media(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_name = db.Column(db.String(100), nullable=True)
    media_type = db.Column(db.String(20), nullable=False)  # winner or event
    image_path = db.Column(db.String(200), nullable=False)
    caption = db.Column(db.String(200), nullable=True)

# Initialize database and create default admin
def init_db():
    with app.app_context():
        db.create_all()
        # Create default admin if not exists
        if not Admin.query.filter_by(username='admin').first():
            admin = Admin(
                username='admin',
                password_hash=generate_password_hash('admin123')
            )
            db.session.add(admin)
            db.session.commit()
            print("Default admin created (username: admin, password: admin123)")

# Special route for periodic Database initialization/reset on Vercel
@app.route('/db-setup')
def db_setup():
    try:
        init_db()
        # Force update admin password
        admin = Admin.query.filter_by(username='admin').first()
        if admin:
            admin.password_hash = generate_password_hash('Soevajrasports')
            db.session.commit()
            return jsonify({"message": "Database initialized. Admin password reset to 'Soevajrasports'."})
        return jsonify({"message": "Database initialized."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Helper function to recalculate points
def recalculate_points():
    departments = Department.query.all()
    for dept in departments:
        total = db.session.query(db.func.sum(Result.points_awarded)).filter_by(department_id=dept.id).scalar() or 0
        dept.total_points = total
    
    # Update rankings
    sorted_depts = sorted(departments, key=lambda x: x.total_points, reverse=True)
    for idx, dept in enumerate(sorted_depts, 1):
        dept.rank = idx
    
    db.session.commit()

# Authentication Routes
@app.route('/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        print(f"Login attempt for: {data.get('username')}") # Debug log
        
        admin = Admin.query.filter_by(username=data.get('username')).first()
        
        if admin and check_password_hash(admin.password_hash, data.get('password')):
            session['admin_logged_in'] = True
            session['admin_id'] = admin.id
            return jsonify({'success': True, 'message': 'Login successful'})
        
        print("Invalid credentials or admin not found") # Debug log
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    except Exception as e:
        print(f"Login Error: {str(e)}") # Debug log
        return jsonify({'success': False, 'message': f'Server Error: {str(e)}'}), 500

@app.route('/admin/logout', methods=['POST'])
def admin_logout():
    session.pop('admin_logged_in', None)
    session.pop('admin_id', None)
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/admin/check', methods=['GET'])
def check_admin():
    if session.get('admin_logged_in'):
        return jsonify({'authenticated': True})
    return jsonify({'authenticated': False}), 401

# Department Management
@app.route('/api/departments', methods=['GET', 'POST'])
def manage_departments():
    if request.method == 'GET':
        departments = Department.query.order_by(Department.rank).all()
        return jsonify([{
            'id': d.id,
            'name': d.name,
            'total_points': d.total_points,
            'rank': d.rank
        } for d in departments])
    
    if request.method == 'POST':
        if not session.get('admin_logged_in'):
            return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.get_json()
        dept = Department(name=data['name'])
        db.session.add(dept)
        db.session.commit()
        recalculate_points()
        return jsonify({'success': True, 'id': dept.id})

@app.route('/api/departments/<int:dept_id>', methods=['PUT', 'DELETE'])
def modify_department(dept_id):
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    dept = Department.query.get_or_404(dept_id)
    
    if request.method == 'PUT':
        data = request.get_json()
        dept.name = data['name']
        db.session.commit()
        return jsonify({'success': True})
    
    if request.method == 'DELETE':
        db.session.delete(dept)
        db.session.commit()
        recalculate_points()
        return jsonify({'success': True})

# Result Management
@app.route('/api/results', methods=['GET', 'POST'])
def manage_results():
    if request.method == 'GET':
        results = Result.query.all()
        return jsonify([{
            'id': r.id,
            'event_name': r.event_name,
            'event_type': r.event_type,
            'department_id': r.department_id,
            'department_name': r.department.name,
            'position': r.position,
            'points_awarded': r.points_awarded
        } for r in results])
    
    if request.method == 'POST':
        if not session.get('admin_logged_in'):
            return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.get_json()
        
        result = Result(
            event_name=data['event_name'],
            event_type=data['event_type'],
            department_id=data['department_id'],
            position=data['position'],
            points_awarded=data['points_awarded']
        )
        db.session.add(result)
        db.session.commit()
        recalculate_points()
        return jsonify({'success': True, 'id': result.id})

@app.route('/api/results/<int:result_id>', methods=['DELETE'])
def delete_result(result_id):
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    result = Result.query.get_or_404(result_id)
    db.session.delete(result)
    db.session.commit()
    recalculate_points()
    return jsonify({'success': True})

# Media Management
@app.route('/api/media', methods=['GET', 'POST'])
def manage_media():
    if request.method == 'GET':
        media = Media.query.all()
        return jsonify([{
            'id': m.id,
            'event_name': m.event_name or 'N/A',
            'media_type': m.media_type,
            'image_path': m.image_path,
            'caption': m.caption
        } for m in media])
    
    if request.method == 'POST':
        if not session.get('admin_logged_in'):
            return jsonify({'error': 'Unauthorized'}), 401
        
        if 'image' not in request.files:
            return jsonify({'error': 'No image file'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"

        # Cloudinary Upload
        if os.environ.get('CLOUDINARY_CLOUD_NAME'):
            upload_result = cloudinary.uploader.upload(file, public_id=filename.split('.')[0])
            image_path = upload_result['secure_url']
        else:
            # Local Upload
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            image_path = f'uploads/{filename}'
        
        media = Media(
            event_name=request.form.get('event_name') or None,
            media_type=request.form.get('media_type', 'event'),
            image_path=image_path,
            caption=request.form.get('caption', '')
        )
        db.session.add(media)
        db.session.commit()
        return jsonify({'success': True, 'id': media.id, 'path': media.image_path})

@app.route('/api/media/<int:media_id>', methods=['DELETE'])
def delete_media(media_id):
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    media = Media.query.get_or_404(media_id)
    
    # Delete file from filesystem
    try:
        os.remove(os.path.join('static', media.image_path))
    except:
        pass
    
    db.session.delete(media)
    db.session.commit()
    return jsonify({'success': True})

# Public Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin_page():
    return render_template('admin_login.html')

@app.route('/admin/dashboard')
def admin_dashboard():
    if not session.get('admin_logged_in'):
        return render_template('admin_login.html')
    return render_template('admin_dashboard.html')

if __name__ == '__main__':
    # Only run init_db locally if not using Postgres
    if not (os.environ.get('DATABASE_URL') or os.environ.get('POSTGRES_URL')):
        init_db()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
