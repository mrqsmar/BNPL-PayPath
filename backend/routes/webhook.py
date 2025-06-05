import stripe
from flask import Blueprint, request, jsonify
from config import Config

# creating the Flask Blueprint for webhook, API keys and secrets
webhook_bp = Blueprint('webhook', __name__)
stripe_api_key = Config.STRIPE_API_KEY
endpoint_secret = Config.STRIPE_WEBHOOK_SECRET


@webhook_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.data
    sig = request.headers.get("Stripe-Signature", "")
    event = None

    try:
        event = stripe.Webhook.construct_event(payload, sig, event)
    except stripe.error.SignatureVerificationError:
        return jsonify({'error': "Invalid Signature"}, 400)
    except ValueError:
        return jsonify({'error': "Invalid Payload"}, 400)

    # handle event types
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        print(f"Payment succeeded for invoice: {session.get('metadata', {}).get('invoice_number')}")

    return jsonify({'status': 'received'}), 200