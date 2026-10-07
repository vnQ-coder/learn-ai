from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import (
    module_01,
    module_02,
    module_03,
    module_04,
    module_05,
    module_06,
    module_07,
    module_08,
    module_09,
    module_10,
    module_11,
    module_12,
    module_13,
    module_14,
    module_15,
    module_16,
    module_17,
    module_18,
    module_19,
    module_20,
    module_21,
    module_22,
    module_23,
    module_24,
    module_25,
    module_26,
    module_27,
    module_28,
    module_29,
    module_33,
)

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
app.include_router(module_10.router)
app.include_router(module_11.router)
app.include_router(module_12.router)
app.include_router(module_13.router)
app.include_router(module_14.router)
app.include_router(module_15.router)
app.include_router(module_16.router)
app.include_router(module_17.router)
app.include_router(module_18.router)
app.include_router(module_19.router)
app.include_router(module_20.router)
app.include_router(module_21.router)
app.include_router(module_22.router)
app.include_router(module_23.router)
app.include_router(module_24.router)
app.include_router(module_25.router)
app.include_router(module_26.router)
app.include_router(module_27.router)
app.include_router(module_28.router)
app.include_router(module_29.router)
app.include_router(module_33.router)
