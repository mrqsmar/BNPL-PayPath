from flask import Flask
from config import Config
from routes.payments import payments_bp
from routes.invoices import invoice_bp
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from.object(Config)

    # register payment route
    app.register_blueprint(payments_bp)

    # register invoices route
    app.register_blueprint(invoice_bp)

    db.init_app(app)

    return app

if __name__ == '__main__':
    app.run(debug=True)