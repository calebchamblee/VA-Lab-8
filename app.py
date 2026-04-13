import time

import numpy as np
import pandas as pd
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
datasets = ["blobs", "circles", "lines", "moons", "uniform"]
history = []


@app.route("/")
def index():
    return render_template("index.html", datasets=datasets)


# example POST request handle
@app.route("/init", methods=["POST"])
def init():
    # parse request sent from the front end
    data = request.json['data']
    n_clusters = request.json['n_clusters']
    # convert to np array with list comprehension
    all_data = np.array([[point['x'], point['y']] for point in data])
    centroids = []
    # randomize centroids as a random point within the range of the data, for x and y
    for i in range(n_clusters):
        x = np.random.uniform(all_data[:, 0].min(), all_data[:, 0].max())
        y = np.random.uniform(all_data[:, 1].min(), all_data[:, 1].max())
        centroids.append([x, y])
    # initialize labels to closest centroid to each point
    labels = []
    for i in range(len(data)):
        distances = [((all_data[i][0] - centroid[0])**2 + (all_data[i][1] - centroid[1])**2)**0.5 for centroid in centroids]
        # closest centroid to point (argmin gets index)
        labels.append(np.argmin(distances))

    # reset history and initialize to only have the randomized centroids and the labels
    history.clear()
    history.append([centroids, labels])

    # return centroids and labels to frontend to plot
    return jsonify({'centroids': centroids, 'labels': labels.tolist()})

@app.route("/step_forward", methods=["POST"])
def step_forward():
    # get data from frontend
    data = request.json['data']
    all_data = np.array([[point['x'], point['y']] for point in data])
    # get centroids as last centroids in history
    converged = step(all_data, history[-1][0])

    # return centroids and labels to frontend to plot via history
    return jsonify({'centroids': history[-1][0], 'labels': history[-1][1].tolist(), 'converged': converged})

@app.route("/step_backward", methods=["POST"])
def step_backward():
    # step back...
    stepBack()
    # return centroids and labels to frontend to plot via history
    return jsonify({'centroids': history[-1][0], 'labels': history[-1][1].tolist()})

def step(data, centroids):
    labels = []
    # for each point, get distances from each centroid, choose minimum
    for i in range(len(data)):
        distances = [((data[i][0] - centroid[0])**2 + (data[i][1] - centroid[1])**2)**0.5 for centroid in centroids]
        # closest centroid to point (argmin gets index)
        labels.append(np.argmin(distances))

    # compute new centroids
    new_centroids = []
    labels = np.array(labels)
    for k in range(len(centroids)):
        # get all points assigned to current centroid via boolean list
        assigned = data[labels == k]
        # if no points in centroid, don't move centroid
        if len(assigned) == 0:
            new_centroids.append(centroids[k])
        # create new centroid as mean of all points in centroid (mean(x), mean(y))
        else:
            mean_x = sum(point[0] for point in assigned) / len(assigned)
            mean_y = sum(point[1] for point in assigned) / len(assigned)
            new_centroids.append([mean_x, mean_y])
    
    # check if last step didn't change centroids
    converged = (new_centroids == history[-1][0])

    # add centroids to history
    history.append([new_centroids, labels])

    # return if the algorithm has converged so we can determine out whether to plot
    return converged

def stepBack():
    # only step back if possible
    if len(history) > 1:
        # remove last entry of history and reassign centroids and labels to end of history
        history.pop()
        centroids = history[-1][0]
        labels = history[-1][1]

if __name__ == "__main__":
    app.run(debug=True)
