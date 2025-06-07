from flask import jsonify, Blueprint
from ..models import Invoice


invoice_bp = Blueprint('invoices', __name__)


# function that gets invoice number
@invoice_bp.route('/api/invoices/<string:invoice_number>', methods=['GET'])
def fetch_invoice_number(invoice_number):
    invoice = Invoice.query.filter_by(invoice_number=invoice_number).first()

    # if the invoice is present, return invoice details
    if invoice:
        return jsonify({
            "invoice_number": invoice.invoice_number,
            "customer_name": invoice.customer_name,
            "customer_email": invoice.customer_email,
            "description_of_service": invoice.description_of_service,
            "amount_due": invoice.amount_due,
            "business_name": invoice.business_name,
            "business_email": invoice.business_email,
            "payment_link": invoice.payment_link
        }), 200
    else:
        return jsonify({
            "error": "Invoice is not found"
        }), 404
