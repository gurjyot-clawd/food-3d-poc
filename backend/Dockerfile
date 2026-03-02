FROM python:3.11-slim

ENV POETRY_HOME=/opt/poetry     POETRY_VERSION=2.3.2     POETRY_VIRTUALENVS_IN_PROJECT=true     POETRY_NO_INTERACTION=1

RUN apt-get update && apt-get install -y --no-install-recommends     build-essential     cmake     git     curl     ffmpeg     && rm -rf /var/lib/apt/lists/*

RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="$POETRY_HOME/bin:$PATH"

WORKDIR /app
COPY pyproject.toml poetry.lock* ./
RUN poetry install --no-root

COPY . .
RUN chmod +x start.sh

CMD ["bash", "start.sh"]
