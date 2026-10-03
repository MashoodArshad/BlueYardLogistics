import os
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from models import ContainerAnalysisRequest, ContainerAnalysisResponse

class CargoAnalyzer:
    def __init__(self, dataset_path: str):
        self.dataset_path = dataset_path
        self.model = LinearRegression()
        self.cargo_type_mapping = {
            "Medicine": 1,
            "Food": 2,
            "Electronics": 3,
            "Clothing": 4,
            "Toys": 5,
            "Stationery": 6
        }
        self.priority_mapping = {
            "High": 3,
            "Normal": 2,
            "Low": 1
        }
        self._train_model()

    def _train_model(self):
        """Loads historical data, preprocesses it, and trains a linear regression model for dwell time."""
        if not os.path.exists(self.dataset_path):
            raise FileNotFoundError(f"Dataset not found at {self.dataset_path}")

        df = pd.read_csv(self.dataset_path)

        # Preprocessing: Map categorical features to numerical
        df['cargo_code'] = df['cargo_type'].map(self.cargo_type_mapping).fillna(4)
        df['priority_code'] = df['priority_level'].map(self.priority_mapping).fillna(2)

        # Features (X) and Target (y)
        X = df[['cargo_code', 'priority_code', 'weight_kg']]
        y = df['historical_dwell_hours']

        # Train regression model
        self.model.fit(X, y)
        print("✓ Dwell-Time ML Regression Model successfully trained.")

    def calculate_priority_score(self, cargo_type: str, priority_level: str, weight_kg: int) -> int:
        """
        Calculates a priority score between 1 and 100.
        Formula: Base Priority Weight + Cargo Urgency Weight - Heavy Cargo Handling Penalty
        """
        # 1. Base Priority Weight (Max 50 pts)
        base_scores = {"High": 50, "Normal": 30, "Low": 10}
        score = base_scores.get(priority_level, 25)

        # 2. Cargo Sensitivity / Urgency (Max 40 pts)
        cargo_scores = {
            "Medicine": 40,
            "Food": 35,
            "Electronics": 30,
            "Clothing": 15,
            "Toys": 15,
            "Stationery": 10
        }
        score += cargo_scores.get(cargo_type, 15)

        # 3. Weight Adjustment (Max 10 pts bonus for light quick-dispatch loads)
        if weight_kg <= 800:
            score += 10
        elif weight_kg <= 1500:
            score += 5
        else:
            score += 2

        # Clamp score to range [1, 100]
        return int(np.clip(score, 1, 100))

    def assess_risk_level(self, cargo_type: str, priority_score: int) -> str:
        """Determines operational risk level based on cargo perishability and priority."""
        if cargo_type in ["Medicine", "Food"] or priority_score >= 80:
            return "High"
        elif cargo_type == "Electronics" or priority_score >= 50:
            return "Medium"
        else:
            return "Low"

    def predict_dwell_hours(self, cargo_type: str, priority_level: str, weight_kg: int) -> int:
        """Uses trained ML model to predict dwell time in hours."""
        cargo_code = self.cargo_type_mapping.get(cargo_type, 4)
        priority_code = self.priority_mapping.get(priority_level, 2)

        feature_vector = pd.DataFrame([[cargo_code, priority_code, weight_kg]],
                                      columns=['cargo_code', 'priority_code', 'weight_kg'])

        predicted_hours = self.model.predict(feature_vector)[0]
        return max(1, int(round(predicted_hours)))

    def analyze(self, request: ContainerAnalysisRequest) -> ContainerAnalysisResponse:
        """Main analysis pipeline coordinating all Data Science logic."""
        priority_score = self.calculate_priority_score(
            request.cargo_type, request.priority_level, request.weight_kg
        )
        
        risk_level = self.assess_risk_level(request.cargo_type, priority_score)
        
        dwell_hours = self.predict_dwell_hours(
            request.cargo_type, request.priority_level, request.weight_kg
        )

        explanation = (
            f"Container {request.container_id} ({request.cargo_type}, {request.weight_kg}kg) evaluated: "
            f"Priority Score={priority_score}/100, Risk Level={risk_level} due to cargo sensitivity. "
            f"Expected Yard Dwell Time is estimated at {dwell_hours} hours."
        )

        return ContainerAnalysisResponse(
            container_id=request.container_id,
            priority_score=priority_score,
            risk_level=risk_level,
            expected_dwell_hours=dwell_hours,
            explanation=explanation
        )