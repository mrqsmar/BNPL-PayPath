import stripe
from flask import Blueprint, request, jsonify
from ..config import Config
from ..models import db, Invoice

# creating the Flask Blueprint for webhook, API keys and secrets
stripe.api_key = Config.STRIPE_API_KEY
endpoint_secret = Config.STRIPE_WEBHOOK_SECRET
print("✅ Using webhook secret:", endpoint_secret)

webhook_bp = Blueprint("webhook_bp", __name__)

@webhook_bp.route('/test', methods=['GET', 'POST'])
def test_route():
    print("🧪 TEST ROUTE HIT!")
    return jsonify({'message': 'test works'}), 200

@webhook_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.data
    sig = request.headers.get("Stripe-Signature", "")
    
    try:
        event = stripe.Webhook.construct_event(payload, sig, endpoint_secret)
    except stripe.error.SignatureVerificationError:
        return jsonify({'error': "Invalid Signature"}), 403
    except ValueError:
        return jsonify({'error': "Invalid Payload"}), 400

    # handle completed session ending 
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        metadata = session.get('metadata', {})
        invoice_number = metadata.get('invoice_number')

        # if the invoice number is missing, it rights back as an error
        if invoice_number is None:
            return jsonify({'error': "Invoice number is missing"}), 400

        print(f"Payment succeeded for invoice: {invoice_number}")

        invoice = Invoice.query.filter_by(invoice_number=invoice_number).first()
        if invoice is not None:
            invoice.paid = True
            db.session.commit()
            print(f"Invoice {invoice_number} is paid")
        else:
            print(f"Invoice {invoice_number} is not paid")

    return jsonify({'status': 'received'}), 200
