import secrets
import httpx
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from core.config import settings
from core.security import create_access_token
from db.session import get_db
from db.repositories.user_repository import UserRepository

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

_state_store: set[str] = set()


@router.get("/login")
async def login(response: Response) -> RedirectResponse:
    state = secrets.token_urlsafe(32)
    _state_store.add(state)

    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": f"{settings.backend_url}/auth/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "select_account",
    }
    url = GOOGLE_AUTH_URL + "?" + "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(url)


@router.get("/callback")
async def callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    if state not in _state_store:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state")
    _state_store.discard(state)

    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": f"{settings.backend_url}/auth/callback",
                "grant_type": "authorization_code",
            },
        )
        token_response.raise_for_status()
        tokens = token_response.json()

        userinfo_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        userinfo_response.raise_for_status()
        userinfo = userinfo_response.json()

    repo = UserRepository(db)
    user = await repo.get_by_google_id(userinfo["sub"])

    if user:
        await repo.update(user, name=userinfo["name"], avatar=userinfo.get("picture"))
    else:
        user = await repo.create(
            google_id=userinfo["sub"],
            email=userinfo["email"],
            name=userinfo["name"],
            avatar=userinfo.get("picture"),
        )

    token = create_access_token(user.id)
    redirect = RedirectResponse(url=settings.frontend_url, status_code=302)
    redirect.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )
    return redirect


@router.post("/logout")
async def logout() -> Response:
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    response.delete_cookie("access_token", path="/")
    return response
