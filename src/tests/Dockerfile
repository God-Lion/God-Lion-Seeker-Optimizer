FROM spinlud/python3-selenium-chrome:latest

WORKDIR /app

COPY godlionseeker ./godlionseeker
COPY tests ./tests
COPY requirements.txt .

RUN pip install -r requirements.txt

CMD pytest --capture=no --log-cli-level=INFO
