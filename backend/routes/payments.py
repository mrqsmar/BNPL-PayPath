
from flask import Blueprint, request, jsonify
from services.stripe_processor import create_checkout_session
from models import Invoice, db
import logging

logger = logging.getLogger(__name__)

payments_bp = Blueprint('payments', __name__)


@payments_bp.route('/api/create-checkout', methods=["POST"])
def handle_create_checkout():
    # the server works
    try:
        invoice_data = request.get_json(force=True)
        session_url = create_checkout_session(invoice_data)

        # if the checkout session is crated with the invoice, returns the url, 
        # if not then its not created
        if session_url:
            # Save to the database since the session has data
            invoice = Invoice(
                invoice_number=invoice_data['invoice_number'],
                customer_name=invoice_data['customer_name'],
                customer_email=invoice_data['customer_email'],
                description_of_service=invoice_data['description_of_service'],
                amount_due=invoice_data['amount_due'],
                business_name=invoice_data.get('business_name'),
                business_email=invoice_data.get('business_email'),
                payment_link=session_url
            )

            db.session.add(invoice)
            db.session.commit()

            # check if the invoice is duplicated
            existing = Invoice.query.filter_by(invoice_number=invoice_data['invoice_number']).first()
            if existing:
                return jsonify({'error': 'Invoice already exists'}), 400            

            return jsonify({'checkout_url': session_url}), 200
        else:
            return jsonify({'error': "Failed to create checkout session"}), 500
    except Exception as e:
        logger.exception("Checkout creation failed")
        return jsonify({'error': f"Internal code server error:{str(e)}"}), 500

