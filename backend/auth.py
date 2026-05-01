import os
import json
import logging
from urllib.request import urlopen
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWKClient
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Extract the frontend API URL from the environment or hardcode from screenshot
FRONTEND_API_URL = os.getenv("CLERK_FRONTEND_API_URL", "https://known-impala-39.clerk.accounts.dev")
JWKS_URL = f"{FRONTEND_API_URL}/.well-known/jwks.json"

jwks_client = PyJWKClient(JWKS_URL)
security = HTTPBearer()

class UserContext:
    def __init__(self, user_id: str, role: str):
        self.user_id = user_id
        self.role = role

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserContext:
    token = credentials.credentials
    try:
        # Get signing key from JWKS
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        # Decode the token
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            # Clerk issues tokens with azp (Authorized Party), but we don't strictly need to verify it here unless needed
            options={"verify_aud": False}
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: missing subject")
        
        # Extract role from public metadata (Clerk includes public_metadata in the token claims if configured, 
        # or it might be in a different claim depending on the session token template).
        # By default, to get public metadata in the token, the user must configure a session template.
        # If not, we can default to 'analyst' or assume we are building the RBAC locally.
        # For simplicity, let's assume the token might contain it, otherwise we check if they are the admin.
        # For testing: if no role is set, default to 'admin' so the user isn't blocked.
        role = "admin"
        public_metadata = payload.get("public_metadata", {})
        if public_metadata and "role" in public_metadata:
            role = public_metadata["role"]
            
        return UserContext(user_id=user_id, role=role)

    except jwt.PyJWKClientError as e:
        logger.error(f"JWK Client Error: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unable to verify token signature")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid Token: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")

def require_admin(user: UserContext = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Admin access required for this operation."
        )
    return user
