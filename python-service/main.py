import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import ContainerAnalysisRequest, ContainerAnalysisResponse
from analyzer import CargoAnalyzer

# Initialize FastAPI App
app = FastAPI(
    title="Blue Yard Logistics — AI Analytics Service",
    description="Microservice providing dwell-time estimation, priority scoring, and cargo risk assessment.",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Analyzer with Dataset
dataset_file = os.path.join(os.path.dirname(__file__), "dataset", "cargo_history.csv")
analyzer = CargoAnalyzer(dataset_path=dataset_file)

@app.get("/")
def root():
    return {
        "service": "Blue Yard Logistics Analytics Microservice",
        "status": "Healthy & Online",
        "documentation": "/docs"
    }

@app.post("/analyze", response_model=ContainerAnalysisResponse)
def analyze_container(payload: ContainerAnalysisRequest):
    """
    Receives container metadata, executes feature scoring and ML regression,
    and returns optimization metrics for Terminal & Yard allocation.
    """
    try:
        result = analyzer.analyze(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))