from flask import jsonify, Blueprint
from models import Invoice


invoice_bp = Blueprint('invoices', __name__)


# function that gets invoice number
@invoice_bp.route('/api/invoices/<invoice_number>', methods=['GET'])
def fetch_invoice_number(invoice_number):
    invoice = Invoice.query.filter_by(invoice_number=invoice_number).first()

    # if the invoice is present, return invoice details
    if invoice:
        return jsonify({
            "invoice_number": Invoice.invoice_number,
            "customer_name": Invoice.customer_name,
            "customer_email": Invoice.customer_email,
            "description_of_service": Invoice.description_of_service,
            "amount_due": Invoice.amount_due,
            "business_name": Invoice.business_name,
            "business_email": Invoice.business_email,
            "payment_link": Invoice.payment_link
        }), 200
    else:
        return jsonify({
            "error": "Invoice is not found"
        }), 404
