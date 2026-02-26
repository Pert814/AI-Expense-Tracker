# Dockerfile is like a blueprint for building a Docker image. 
# It contains instructions on how to set up the environment, 
# install dependencies, and run the application.

# python:3.10-slim is a lightweight version of the official Python image
FROM python:3.11-slim

# System root directory 
WORKDIR /app

# Prevent Python from buffering output
ENV PYTHONUNBUFFERED=1
# Setting to prevent Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1

# Install dependencies from requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy the entire project into the container's working directory.
COPY . .

# Expose the port that the application will run on.
EXPOSE 8080

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
