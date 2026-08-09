import numpy as np
import onnxruntime as ort


class Predictor:

    def __init__(self, model_path):
        self.session = ort.InferenceSession(str(model_path))
        self.input_name = self.session.get_inputs()[0].name

    def predict(self, features):

        # Convert input into NumPy array
        features = np.array(
            [features],
            dtype=np.float32
        )

        # Run ONNX model
        outputs = self.session.run(
            None,
            {
                self.input_name: features
            }
        )

        # Extract prediction
        prediction = int(outputs[0][0])

        # Extract probability (if available)
        probability = None

        if len(outputs) > 1:
            probabilities = outputs[1][0]

            if isinstance(probabilities, dict):
                probability = float(probabilities.get(1, 0.0))
            else:
                probability = float(probabilities[1])

        return {
            "prediction": prediction,
            "probability": probability
        }