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


# gets invoices whether paid or unpaid
@invoice_bp.route('/api/invoices/<string:paid>', methods=['GET'])
def get_invoices_status(paid):
    # check if the status is true or false
    if paid.lower() == "True":
        invoice_status = True
    if paid.lower() == "False":
        invoice_status = False
    else:
        return jsonify({'error': 'invalid paid code, use true or false'}), 400
    
    invoices = Invoice.query.filter_by(paid=invoice_status).first()

    result = []
    for invoice in invoices:
        result.append({
            "invoice_number": invoice.invoice_number,
            "customer_name": invoice.customer_name,
            "amount_due": invoice.amount_due,
            "paid": invoice.paid
        })

    return jsonify(result), 200