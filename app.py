from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello_world():
    return render_template('/public/index.html')

@app.route('/infrastucture')
def hello_world():
    return 'Hello Hydra!'\

@app.route('/infrastucture', methods=['GET', 'POST'])
def hello_world():
    return 'Hello Hydra!'

if __name__ == '__main__':
    app.run()
