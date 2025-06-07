from flask_sqlalchemy import SQLAlchemy

# Create database
db = SQLAlchemy()


class Invoice(db.Model):
    __tablename__ = 'invoices'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    invoice_number = db.Column(db.String(200), unique=True, nullable=False)
    customer_name = db.Column(db.String(200))
    customer_email = db.Column(db.String(200), nullable=False)
    description_of_service = db.Column(db.String(500))
    amount_due = db.Column(db.Float, nullable=False)
    business_name = db.Column(db.String(200))
    business_email = db.Column(db.String(200))
    payment_link = db.Column(db.String, nullable=True)
    paid = db.Column(db.Boolean, default=False)
