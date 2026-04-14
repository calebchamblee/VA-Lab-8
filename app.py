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
    n_clusters = int(request.json['n_clusters'])
    # convert to np array with list comprehension
    all_data = np.array([[point['x'], point['y']] for point in data])
    
    # Check for manual centroids sent from textboxes
    manual_centroids = request.json.get('centroids')
    
    if manual_centroids:
        centroids = manual_centroids
    else:
        centroids = []
        # randomize centroids as a random point within the range of the data, for x and y
        for i in range(n_clusters):
            x = np.random.uniform(all_data[:, 0].min(), all_data[:, 0].max())
            y = np.random.uniform(all_data[:, 1].min(), all_data[:, 1].max())
            centroids.append([x, y])
            
    # initialize labels to closest centroid to each point
    labels = []
    for i in range(len(data)):
        # original distance formula
        distances = [((all_data[i][0] - centroid[0])**2 + (all_data[i][1] - centroid[1])**2)**0.5 for centroid in centroids]
        # closest centroid to point (argmin gets index)
        labels.append(int(np.argmin(distances)))

    # reset history and initialize to only have the randomized centroids and the labels
    history.clear()
    history.append([centroids, labels])

    # return centroids and labels to frontend to plot
    return jsonify({'centroids': centroids, 'labels': labels})

@app.route("/step_forward", methods=["POST"])
def step_forward():
    # get data from frontend
    data = request.json['data']
    all_data = np.array([[point['x'], point['y']] for point in data])
    converged = step(all_data, history[-1][0])

    # return centroids and labels to frontend to plot via history
    return jsonify({
        'centroids': history[-1][0], 
        'labels': history[-1][1], 
        'converged': converged,
        'step': len(history) - 1
    })

@app.route("/step_backward", methods=["POST"])
def step_backward():
    # step back...
    stepBack()
    # return centroids and labels to frontend to plot via history
    return jsonify({
        'centroids': history[-1][0], 
        'labels': history[-1][1].tolist() if hasattr(history[-1][1], 'tolist') else history[-1][1],
        'step': len(history) - 1
    })

def step(data, centroids):
    labels = []
    # for each point, get distances from each centroid, choose minimum
    for i in range(len(data)):
        distances = [((data[i][0] - centroid[0])**2 + (data[i][1] - centroid[1])**2)**0.5 for centroid in centroids]
        # closest centroid to point (argmin gets index)
        labels.append(np.argmin(distances))

    # compute new centroids
    new_centroids = []
    labels_np = np.array(labels)
    for k in range(len(centroids)):
        # get all points assigned to current centroid via boolean list
        assigned = data[labels_np == k]
        # if no points in centroid, don't move centroid
        if len(assigned) == 0:
            new_centroids.append(centroids[k])
        # create new centroid as mean of all points in centroid (mean(x), mean(y))
        else:
            mean_x = float(np.mean(assigned[:, 0]))
            mean_y = float(np.mean(assigned[:, 1]))
            new_centroids.append([mean_x, mean_y])
    
    # check if last step didn't change centroids
    # np.allclose is safer than == for floats
    converged = np.allclose(new_centroids, centroids, atol=1e-4)

    # add centroids and labels to history
    history.append([new_centroids, labels_np.tolist()])

    # return if the algorithm has converged
    return converged

def stepBack():
    # only step back if possible
    if len(history) > 1:
        # remove last entry of history
        history.pop()

if __name__ == "__main__":
    # Standardized port to 3000
    app.run(debug=True, port=3000)