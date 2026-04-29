from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_attachments import router as attachments_router
from app.api.routes_data import router as data_router
from app.api.routes_health import router as health_router
from app.api.routes_meta import router as meta_router
from app.api.routes_users import router as users_router
from app.core.config import settings
from app.minio_client import ensure_bucket


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_bucket()
    yield


app = FastAPI(
    title="Schema-Driven UI API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(meta_router)
app.include_router(data_router)
app.include_router(users_router)
app.include_router(attachments_router)
