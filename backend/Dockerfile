# Dockerfile is like a blueprint for building a Docker image. 
# It contains instructions on how to set up the environment, 
# install dependencies, and run the application.

# python:3.10-slim is a lightweight version of the official Python image
From python:3.10-slim

# System root directory 
WORKDIR /app

# Prevent Python from buffering output
ENV PYTHONUNBUFFERED=1
# Setting to prevent Python from writing .pyc files, 
# which can be useful in a containerized environment 
# where you want to avoid unnecessary file generation and keep the container clean.
ENV PYTHONDONTWRITEBYTECODE=1

# Install dependencies from requirements.txt. 
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy the entire project into the container's working directory.
COPY . .

# Expose the port that the application will run on.
CMD ["sh", "-c", "unicorn app:app --host 0.0.0.0  --port $"]

