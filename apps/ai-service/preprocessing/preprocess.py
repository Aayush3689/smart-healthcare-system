import pandas as pd


def load_data(path):
    """
    Load CSV dataset.
    """
    return pd.read_csv(path)


def clean_data(df):
    """
    Remove duplicate rows and fill missing numeric values.
    """

    # Create a copy to avoid SettingWithCopyWarning
    df = df.copy()

    # Remove duplicate rows
    df = df.drop_duplicates()

    # Fill missing values in numeric columns with median
    numeric_cols = df.select_dtypes(include=["number"]).columns

    for col in numeric_cols:
        df.loc[:, col] = df[col].fillna(df[col].median())

    return df


def split_features(df, target_column):
    """
    Split features and target.
    Automatically remove non-numeric columns.
    """

    # Remove target column
    X = df.drop(columns=[target_column])

    # Keep only numeric columns
    X = X.select_dtypes(include=["number"])

    # Target column
    y = df[target_column]

    return X, y