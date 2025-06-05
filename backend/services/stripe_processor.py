# stripe processor

import stripe
from config import Config

# Secreet key
stripe.api_key = Config.STRIPE_API_KEY

def create_checkout_session(invoice):