from fastapi import APIRouter
from .questions import router as questions_router
from .sessions import router as sessions_router
from .analytics import router as analytics_router
from .rag import router as rag_router
from .config import router as config_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(questions_router)
api_v1_router.include_router(sessions_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(rag_router)
api_v1_router.include_router(config_router)



