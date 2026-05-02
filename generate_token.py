import jwt
import time
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("VIDEOSDK_API_KEY")
secret = os.getenv("VIDEOSDK_SECRET")
payload = {
    "apikey": api_key,
    "permissions": ["allow_join"],
    "iat": int(time.time()),
    "exp": int(time.time()) + 86400 * 365,
}
token = jwt.encode(payload, secret, algorithm="HS256")
print(token)
