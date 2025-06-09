import os
from dotenv import load_dotenv

# loading the environment from env
load_dotenv()


class Config:
    # Secret keys
    SECRET_KEY = os.getenv("SECRET_KEY", "fallback-dev-secret")

    # Stripe API stuff
    STRIPE_API_KEY = os.getenv("STRIPE_API_KEY")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

    # SQL Alchmey Database
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "postgresql://localhost/paypath")
