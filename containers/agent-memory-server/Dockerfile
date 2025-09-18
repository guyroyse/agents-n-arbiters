FROM python:3.12-alpine

# Set working directory
WORKDIR /app

# Create a simple placeholder HTML file
RUN echo '<html><body><h1>Agent Memory Server Placeholder</h1><p>Running on port 8000</p></body></html>' > index.html

# Expose port 8000 (AMS default)
EXPOSE 8000

# Run simple HTTP server
CMD ["python", "-m", "http.server", "8000"]