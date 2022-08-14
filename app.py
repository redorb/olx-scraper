import time
import os
from flask import Flask
from flask import render_template, send_from_directory
from markupsafe import escape

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('osm-marker-popup.html')
    
    
@app.route('/data/')
def data():
    return render_template('data.csv')
    
    
@app.route("/static/<path:path>")
def static_dir(path):
    return send_from_directory("static", path)
    
    
"""
useful:
    https://flask.palletsprojects.com/en/1.1.x/cli/
    Windows CMD:
        > set FLASK_APP=app
        > flask run
    Windows PowerShell:
        > $env:FLASK_APP = "app"
        > flask run
        
    https://www.w3schools.com/jsref/jsref_parsefloat.asp
    https://stackoverflow.com/questions/10359907/how-to-compute-the-sum-and-average-of-elements-in-an-array
    https://stackoverflow.com/questions/8284217/iframe-and-external-website
    https://stackoverflow.com/questions/27358966/how-to-set-x-frame-options-on-iframe
    https://bobbyhadz.com/blog/javascript-count-elements-in-div
"""
