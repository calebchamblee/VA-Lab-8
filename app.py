import time

import numpy as np
import pandas as pd
from flask import Flask, render_template, request

app = Flask(__name__)
datasets = ["blobs", "circles", "lines", "moons", "uniform"]
history = []


@app.route("/")
def index():
    return render_template("index.html", datasets=datasets)


# example POST request handle
@app.route("/your_route", methods=["POST"])
def your_route_func():
    # parse request sent from the front end
    request_data = request.get_json()
    print("request_data", request_data)

    # return data to front end
    return dict(msg="a", data={"a": 1, "b": 2})

def step(data, centroids, labels):
    new_labels = []
    for point in data:
        distances = [((point[0] - centroid[0])**2 + (point[1] - centroid[1])**2)**0.5 for centroid in centroids]
        new_labels.append(np.argmin(distances))

    new_centroids = []
    for k in range(len(centroids)):
        assigned data[new_labels == k]
        if len(assigned > 0):
            new_centroids.append(assigned.mean(axis=0))
        else:
            new_centroids.append(centroids[k])
    
    history.append([new_centroids, new_labels])

def stepBack():
    if len(history) > 1:
        history.pop()
        centroids = history[-1][0]
        labels = history[-1][1]

if __name__ == "__main__":
    app.run(debug=True)
