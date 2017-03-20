from flask import Flask, render_template, send_from_directory
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)
app.config.from_object(os.environ['APP_SETTINGS'])
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

@app.route('/')
def hello_world():
    return send_from_directory('build', 'index.html')

@app.route('/infrastucture')
def infrastructure():
    return 'Hello Hydra!'\

@app.route('/load', methods=['GET', 'POST'])
def load():
    return 'Hello Hydra!'

if __name__ == '__main__':
    app.run()
