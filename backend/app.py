from flask import Flask
from .config import Config
from .routes.payments import payments_bp
from .routes.invoices import invoice_bp
from .routes.webhook import webhook_bp
from .models import db


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # register payment route
    app.register_blueprint(payments_bp)

    # register invoices route
    app.register_blueprint(invoice_bp)

    # register webhook route
    app.register_blueprint(webhook_bp)

    db.init_app(app)

    @app.route("/")
    def index():
        return "PayPath API is running.", 200

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
