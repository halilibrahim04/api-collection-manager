FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for postgres/psycopg2
RUN apt-get update && apt-get install -y libpq-dev gcc

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run flask migrations at startup, then boot gunicorn
CMD ["sh", "-c", "flask db upgrade && gunicorn -b 0.0.0.0:5000 run:app"]
