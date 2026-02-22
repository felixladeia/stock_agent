from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.settings import settings
from app.api.routes.health import router as health_router
from app.api.routes.analyze import router as analyze_router
from app.api.routes.ohlcv import router as ohlcv_router
from app.api.routes.indicators import router as indicators_router
from app.api.routes.backtest import router as backtest_router

def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version=settings.api_version)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3001",
            "http://127.0.0.1:3001",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(analyze_router)
    app.include_router(ohlcv_router)
    app.include_router(indicators_router)
    app.include_router(backtest_router)

    return app

app = create_app()
