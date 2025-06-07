import sys
import os
import json
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.stripe_processor import create_checkout_session
from unittest.mock import patch

# Test 1: Returns a Stripe URL link
@patch("services.stripe_processor.stripe.checkout.Session.create")
def test_create_checkout_session(mock_create):
    mock_create.return_value.url = "https://checkout.stripe.com/test_session"

    # test using input fields needed
    invoice = {
        "amount_due": "300.00",
        "description_of_service": "Filling cavity",
        "business_name": "Alan's Dental Clinic",
        "customer_name": "John Kim",
        "invoice_number": "INV_392",
        "business_email": "info@alansclinic.com",
        "customer_email": "john@example.com",
    }

    # calls the function but reminder is a mock
    session_url = create_checkout_session(invoice)

    print("Returned Stripe URL:", session_url)

    # assertions
    assert session_url is not None
    assert session_url.startswith("https://checkout.stripe.com/")

# Test 2: Checking if the checkout session includes required fields
@patch("services.stripe_processor.stripe.checkout.Session.create")
def test_checkout_has_elements(mock_create):
    mock_create.return_value.url = "https://checkout.stripe.com/test_session"

    # test using input fields needed
    invoice = {
        "amount_due": "450.00",
        "description_of_service": "Wisdom tooth extraction",
        "business_name": "Smile Dental Group",
        "customer_name": "Alice Lee",
        "invoice_number": "INV_450",
        "business_email": "info@smiledental.com",
        "customer_email": "alice@example.com",
    }

    # calls the function but reminder is a mock
    session_url = create_checkout_session(invoice)

    # grab arguments passed
    _, kwargs = mock_create.call_args
    print("Stripe call kwargs:", json.dumps(kwargs, indent=2))

    # check for amount due
    assert kwargs["line_items"][0]["price_data"]["unit_amount"] == 45000

    # check description filled out
    assert kwargs["line_items"][0]["price_data"]["product_data"]["name"] == "Wisdom tooth extraction"

    # Business name
    assert kwargs["metadata"]["business_name"] == "Smile Dental Group"


# Test 3: Checking if the metadata contains customer name, invoice # and email
@patch("services.stripe_processor.stripe.checkout.Session.create")
def test_for_metadata(mock_create):
    mock_create.return_value_url = "https://checkout.stripe.com/test_session"
    invoice = {
        "amount_due": "830.00",
        "description_of_service": "Gingivitis",
        "business_name": "Shiny Dental Group",
        "customer_name": "Jane Chong",
        "invoice_number": "INV_962",
        "business_email": "info@shinydental.com",
        "customer_email": "jane@example.com",
    }

    # calls the session
    session_url = create_checkout_session(invoice)

    # arguments to call for metadata
    _, kwargs = mock_create.call_args

    # customer name
    assert kwargs["metadata"]["customer_name"] == "Jane Chong"

    # invoice
    assert kwargs["metadata"]["invoice_number"] == "INV_962"

    # email
    assert kwargs["metadata"]["business_email"] == "info@shinydental.com"

# Test 4: Check that the 3 payment methods work 
@patch("services.stripe_processor.stripe.checkout.Session.create")
def test_checkout_supports_payment_methods(mock_create):
    mock_create.return_value.url = "https://checkout.stripe.com/test_session"

    invoice = {
        "amount_due": "199.00",
        "description_of_service": "Dental exam",
        "business_name": "Pearl Dental",
        "customer_name": "Chris Park",
        "invoice_number": "INV_199",
        "business_email": "admin@pearldental.com",
        "customer_email": "chris@example.com",
    }

    create_checkout_session(invoice)

    _, kwargs = mock_create.call_args

    # check payent methods include card, affirm and klarna
    assert set(kwargs["payment_method_types"]) == {"card", "affirm", "klarna"}

    # check if it works
    print("Payment methods passed to Stripe:", kwargs["payment_method_types"])
