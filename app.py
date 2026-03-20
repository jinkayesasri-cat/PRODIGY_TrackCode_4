from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'portfolio.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # 1. Create Contacts Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 2. Create Projects Table (for CMS)
    c.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            image_class TEXT,
            tech_stack TEXT,
            featured BOOLEAN DEFAULT 1
        )
    ''')

    # Seed dummy project data if empty
    c.execute('SELECT COUNT(*) FROM projects')
    if c.fetchone()[0] == 0:
        seed_projects = [
            ("E-Commerce Platform", "A fully responsive, full-stack e-commerce web application. Features include user authentication, a shopping cart, Stripe payment integration, and an admin dashboard for managing products.", "mockup-1", "React,Node.js,MongoDB,Stripe API"),
            ("Kanban Task Manager", "A minimal, lightning-fast task management app featuring drag-and-drop kanban boards, real-time collaboration via WebSockets, and beautifully animated UI components.", "mockup-2", "Vue 3,Firebase,Tailwind CSS"),
            ("AI Image Generator", "A frontend interface for generating images using AI models. Utilizes Stable Diffusion API, featuring user galleries, prompt histories, and social sharing capabilities.", "mockup-3", "Next.js,TypeScript,OpenAI API")
        ]
        c.executemany('INSERT INTO projects (title, description, image_class, tech_stack) VALUES (?, ?, ?, ?)', seed_projects)
        print("Seeded basic projects data.")

    conn.commit()
    conn.close()

# Initialize the database on startup
init_db()

# =======================
# API ROUTES
# =======================

@app.route('/api/contact', methods=['POST'])
def submit_contact():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    subject = data.get('subject', '')
    message = data.get('message')

    if not name or not email or not message:
        return jsonify({'error': 'Name, email, and message are required.'}), 400

    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)', (name, email, subject, message))
        conn.commit()
        last_id = c.lastrowid
        conn.close()
        return jsonify({'message': 'Message sent successfully!', 'id': last_id}), 201
    except Exception as e:
        print(f"Error saving contact message: {e}")
        return jsonify({'error': 'Failed to send message.'}), 500

@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM contacts ORDER BY created_at DESC')
    rows = c.fetchall()
    contacts = [dict(row) for row in rows]
    conn.close()
    return jsonify(contacts)

@app.route('/api/projects', methods=['GET'])
def get_projects():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute('SELECT * FROM projects ORDER BY id ASC')
    rows = c.fetchall()
    projects = [dict(row) for row in rows]
    conn.close()
    return jsonify(projects)

# Catch-all route for frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_index(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    print("Server is running on http://localhost:5000")
    app.run(port=5000, debug=True)
