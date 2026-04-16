from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

app = FastAPI(
    title="MLOps Execution API",
    description="Run Python / ML code securely inside Docker containers.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {"message": "MLOps Execution API is running 🚀"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
