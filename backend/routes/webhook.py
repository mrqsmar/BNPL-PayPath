import stripe
from flask import Blueprint, request, jsonify
from ..config import Config
from ..models import db, Invoice

# creating the Flask Blueprint for webhook, API keys and secrets
webhook_bp = Blueprint('webhook', __name__)
stripe_api_key = Config.STRIPE_API_KEY
endpoint_secret = Config.STRIPE_WEBHOOK_SECRET


@webhook_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.data
    sig = request.headers.get("Stripe-Signature", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig, endpoint_secret)
    except stripe.error.SignatureVerificationError:
        return jsonify({'error': "Invalid Signature"}, 400)
    except ValueError:
        return jsonify({'error': "Invalid Payload"}, 400)

    # handle completed session ending 
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        metadata = session.get('metadata', {})
        invoice_number = metadata.get['invoice_number']

        # if the invoice number is missing, it rights back as an error
        if invoice_number is None:
            return jsonify({'error': "Invoice number is missing"}), 400

        print(f"Payment succeeded for invoice: {invoice_number}")

    return jsonify({'status': 'received'}), 200
