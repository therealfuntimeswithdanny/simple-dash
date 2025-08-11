import sys
import os
import webbrowser
import threading
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy

# Function to get the correct path for bundled resources
def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

# Initialize the Flask app with the correct paths
template_folder = resource_path('templates')
app = Flask(__name__, template_folder=template_folder)

# Configure the database
# Using an absolute path for the database file is safer for a bundled app
db_path = os.path.join(resource_path('.'), 'site.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ... (Bookmark and RSSFeed models remain the same) ...
class Bookmark(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    url = db.Column(db.String(255), nullable=False)
    def __repr__(self):
        return f"Bookmark('{self.name}', '{self.url}')"
    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'url': self.url}

class RSSFeed(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    url = db.Column(db.String(255), nullable=False, unique=True)
    def __repr__(self):
        return f"RSSFeed('{self.name}', '{self.url}')"
    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'url': self.url}

with app.app_context():
    db.create_all()

# ... (All your existing routes remain the same) ...
@app.route('/')
def index():
    return render_template('index.html')

# ... (The rest of your API endpoints follow) ...
@app.route('/api/bookmarks', methods=['GET'])
def get_bookmarks():
    bookmarks = Bookmark.query.all()
    return jsonify([b.to_dict() for b in bookmarks])

@app.route('/api/bookmarks', methods=['POST'])
def add_bookmark():
    data = request.json
    new_bookmark = Bookmark(name=data['name'], url=data['url'])
    db.session.add(new_bookmark)
    db.session.commit()
    return jsonify(new_bookmark.to_dict()), 201

@app.route('/api/bookmarks/<int:bookmark_id>', methods=['DELETE'])
def delete_bookmark(bookmark_id):
    bookmark = Bookmark.query.get_or_404(bookmark_id)
    db.session.delete(bookmark)
    db.session.commit()
    return jsonify({'message': 'Bookmark deleted'}), 200

@app.route('/api/feeds', methods=['GET'])
def get_feeds():
    feeds = RSSFeed.query.all()
    return jsonify([f.to_dict() for f in feeds])

@app.route('/api/feeds', methods=['POST'])
def add_feed():
    data = request.json
    if RSSFeed.query.filter_by(url=data['url']).first():
        return jsonify({'error': 'RSS Feed already exists'}), 409
    
    new_feed = RSSFeed(name=data['name'], url=data['url'])
    db.session.add(new_feed)
    db.session.commit()
    return jsonify(new_feed.to_dict()), 201

@app.route('/api/feeds/<int:feed_id>', methods=['DELETE'])
def delete_feed(feed_id):
    feed = RSSFeed.query.get_or_404(feed_id)
    db.session.delete(feed)
    db.session.commit()
    return jsonify({'message': 'RSS Feed deleted'}), 200

# Function to open the browser
def open_browser():
    # Wait for the server to start before opening the browser
    webbrowser.open_new("http://127.0.0.1:5000")

if __name__ == '__main__':
    # Use a separate thread to open the browser
    threading.Timer(1.25, open_browser).start()
    app.run(debug=False)