from flask import Flask
from routes.views import views_bp
from routes.generate import generate_bp
from routes.history import history_bp

app = Flask(__name__)

app.register_blueprint(views_bp)
app.register_blueprint(generate_bp)
app.register_blueprint(history_bp)

if __name__ == "__main__":
    app.run(debug=True)
