from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse 
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.config import settings
from db.session import engine
from models.orm import Base
from routers import auth, users, lists, tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="FocusFlow API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.landing_url, settings.landing_url.rstrip('/') + '/app'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(lists.router)
app.include_router(tasks.router)

@app.exception_handler(HTTPException)
async def auth_exception_handler(request: Request, exc: HTTPException):
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
    
    if exc.status_code == 401:
        response.delete_cookie(
            key="access_token",
            path="/",
            httponly=True,
            samesite="lax",
            # secure=False убрать для https/prod
        )
    
    return response