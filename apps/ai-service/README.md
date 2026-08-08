# Smart Healthcare AI Service

## Run Locally

pip install -r requirements.txt

uvicorn main:app --reload

## Swagger

http://localhost:8000/docs

## Docker Build

docker build -t smart-healthcare-ai .

## Docker Run

docker run -p 8000:8000 smart-healthcare-ai