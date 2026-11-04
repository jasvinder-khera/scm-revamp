from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import users,otp

app = FastAPI()

# Allow your Next.js frontend (localhost:3000) to talk to FastAPI (localhost:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(otp.router, prefix="/api", tags=["otp"])

@app.get("/api/test")
def test_route():
    return {"message": "Hello from FastAPI!"}