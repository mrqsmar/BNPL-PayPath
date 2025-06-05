
from flask import Blueprint, request, jsonify
from services.stripe_processor import create_checkout_session

payments_bp = Blueprint('payments', __name__)


@payments_bp.route('/api/create-checkout', methods=["POST"])
def handle_create_checkout():
    invoice = request.json(force=True)
    session_url = create_checkout_session(invoice)

    if session_url:
        return jsonify({'checkout_url': session_url}), 200
    else:
        return jsonify({'error': "Failed to create checkout session"}), 500
