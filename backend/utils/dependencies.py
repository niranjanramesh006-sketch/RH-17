from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils.auth import decode_token
from jose import JWTError

bearer = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        payload = decode_token(credentials.credentials)
        return {
            "user_id": payload.get("sub"),
            "role": payload.get("role"),
            "tenant_id": payload.get("tenant_id")
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def require_admin(user=Depends(get_current_user)):
    if user["role"] not in ["tenant_admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def require_super_admin(user=Depends(get_current_user)):
    if user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return user