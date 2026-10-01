from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import module_01, module_02, module_03, module_04, module_05, module_06, module_07, module_08, module_09

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


app.include_router(module_01.router)
app.include_router(module_02.router)
app.include_router(module_03.router)
app.include_router(module_04.router)
app.include_router(module_05.router)
app.include_router(module_06.router)
app.include_router(module_07.router)
app.include_router(module_08.router)
app.include_router(module_09.router)
