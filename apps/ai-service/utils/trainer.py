from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
import joblib


def train_model(X, y, model_path):
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    model = LogisticRegression(
        max_iter=1000,
        class_weight="balanced"
    )

    model.fit(X_train, y_train)

    pred = model.predict(X_test)

    print("\nAccuracy:")
    print(accuracy_score(y_test, pred))

    print("\nClassification Report\n")
    print(classification_report(y_test, pred))

    joblib.dump(model, model_path)

    return model