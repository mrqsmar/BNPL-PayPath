# stripe processor

import stripe
import logging
from ..config import Config

# Secret key
stripe.api_key = Config.STRIPE_API_KEY

# configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def create_checkout_session(invoice):
    """
    Creates a Stripe Checkout session for an invoice.
    Args:
        invoice: Contains all required invoice details
    Returns:
        Session URL
    """
    try:
        # Creating a stripe checkout session
        session = stripe.checkout.Session.create(
            # By Now Pay Later method types
            payment_method_types=[
                "card",
                "affirm",
                "klarna"
            ],
            # Item being purchased
            line_items=[{
                'price_data': {
                    'currency': invoice.get("currency", "usd"),
                    'product_data': {
                        'name': invoice['description_of_service']
                    },
                    'unit_amount': int(float(invoice['amount_due']) * 100),
                },
                'quantity': 1,
            }],
            # Customer and Metadata
            customer_email=invoice.get('customer_email'),
            metadata={
                "customer_name": invoice['customer_name'],
                "invoice_number": invoice['invoice_number'],
                "business_name": invoice['business_name'],
                "business_email": invoice['business_email']
            },
            # one time payment
            mode='payment',
            success_url="https://paypath.com/success",
            cancel_url="https://paypath.com/cancel"
        )
        logger.info(f"Checkout session created for invoice {invoice['invoice_number']}")
        return session.url
    
    except Exception as e:
        logger.error(f"Stripe error: {e}")
        return None
