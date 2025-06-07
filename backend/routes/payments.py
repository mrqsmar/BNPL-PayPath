
from flask import Blueprint, request, jsonify
from services.stripe_processor import create_checkout_session
import logging

logger = logging.getLogger(__name__)

payments_bp = Blueprint('payments', __name__)


@payments_bp.route('/api/create-checkout', methods=["POST"])
def handle_create_checkout():
    # the server works
    try:
        invoice = request.get_json(force=True)
        session_url = create_checkout_session(invoice)

        # if the checkout session is crated with the invoice, returns the url, 
        # if not then its not created
        if session_url:
            return jsonify({'checkout_url': session_url}), 200
        else:
            return jsonify({'error': "Failed to create checkout session"}), 500
    except Exception as e:
        logger.exception("Checkout creation failed")
        return jsonify({'error': f"Internal code server error:{str(e)}"}), 500
