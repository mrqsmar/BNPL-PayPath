import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.stripe_processor import create_checkout_session


def test_create_checkout_session():
    invoice = {
        "amount_due": "300.00",
        "description_of_service": "Filling cavity",
        "business_name": "Alan's Dental Clinic",
        "customer_name": "John Doe",
        "invoice_number": "INV_392",
        "business_email": "info@alansclinic.com",
        "customer_email": "john@example.com",
    }

    session_url = create_checkout_session(invoice)
    assert session_url is not None
    assert session_url.startswith("https:checkout.stripe.com/")
