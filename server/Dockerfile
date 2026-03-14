# 1. Use an official Python image as the base layer
FROM python:3.12-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. copy the requirements file first (for better caching)
COPY requirements.txt .

# 4. Install the Pythong dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the rest of your application code
COPY . .

# Expose port
EXPOSE 8000 

# 6. Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]