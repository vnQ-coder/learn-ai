from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import module_01, module_02, module_03

app = FastAPI(title="AI Learning Curriculum API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Router registrations are added here, one line per router task:
app.include_router(module_01.router)
app.include_router(module_02.router)
app.include_router(module_03.router)
