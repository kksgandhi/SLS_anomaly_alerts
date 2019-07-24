FROM python:3.7.3
WORKDIR /app
COPY . /app
RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 8000
CMD ["gunicorn", "-c", "gunicorn_config.py", "website:app"]

