from fastapi import FastAPI
from app.routes import router
from app.db import connect_db
# Ensure models are imported so neomodel knows about them
from app import models # noqa: F401
from contextlib import asynccontextmanager
from neomodel import db

@asynccontextmanager
async def lifespan(app: FastAPI):
    connect_db()
    try:
        # neomodel 6+ moved install_all_labels to the db singleton
        db.install_all_labels()
    except Exception as e:
        # This might fail if DB is not ready
        print(f"Warning during startup: {e}")
    yield

app = FastAPI(title="MPBGP EVPN Route Manager", lifespan=lifespan)

app.include_router(router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to MPBGP EVPN Route Manager"}
