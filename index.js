let svg = d3
  .select("svg#scatterplot")
  .attr("width", 500)
  .attr("height", 500)
  .style("background", "#eee");

init("blobs", 10);

// Change to color clusters and account for n_clusters
function load_and_plot(filename) {
  d3.csv(`static/datasets/${filename}.csv`, d3.autoType).then((data) => {
    console.log("data", data);
    svg
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("r", 8)
      .attr("fill", "#333")
      .attr("stroke", "#eee")
      .attr("stroke-width", 1)
      .attr("cx", (d) => d.x * 20 + 50)
      .attr("cy", (d) => d.y * 20 + 250);
  });
}

// initialize the plot for given daset and num clusters
async function init(filename, n_clusters) {
  // read in data and convert to numbers
  d3.csv(`static/datasets/${filename}.csv`, d3.autoType).then((data) => {
      // then get data from back end, then plot
      post('/init', {data: data, n_clusters: n_clusters}).then((result) => {
        // add new plotting function here to plot clusters in different colors
        // format: result.centroids: list of centroid points, result.labels: list of label for each point in data
      });
    });
}

// perform k-means clustering: take a step forward until converged
async function run() {
  // get name of dataset and load file
  const filename = document.getElementById('dataset').value;
  d3.csv(`static/datasets/${filename}.csv`, d3.autoType).then(async (data) => {
    let converged = false;
    // redraw for each step until converged, increment step # label
    while (!converged) {
      // get results of one step forward from backend
      const result = await post('/step_forward', {data: data});
      converged = result.converged;
      if (!converged) {
        document.getElementById('step').innerHTML = +(document.getElementById('step').innerHTML) + 1;
      }
      // plot here (same function as init)
    }
  });
}

// take on 'step' forward in k-means
async function forward() {
    const filename = document.getElementById('dataset').value;
    // get name of dataset and load file
    d3.csv(`static/datasets/${filename}.csv`, d3.autoType).then(async (data) => {
      // get results of step forward from backend
      const result = await post('/step_forward', {data: data});
      if (!result.converged) {
        // increment step # label unless converged
        document.getElementById('step').innerHTML = +(document.getElementById('step').innerHTML) + 1;
        // plot here (same function as init)
      }
  });
}

// take on 'step' backward in k-means
async function backward() {
    const filename = document.getElementById('dataset').value;
    // get name of dataset and load file
    d3.csv(`static/datasets/${filename}.csv`, d3.autoType).then(async (data) => {
      // get results of step back from backend
      const result = await post('/step_backward', {data: data});
      if (!result.converged) {
        // decrement step # label unless converged
        document.getElementById('step').innerHTML = +(document.getElementById('step').innerHTML) - 1;
        // plot here (same function as init)
      }
  });
}

// reset k-means clustering to be random again
async function reset() {
    // get current dataset and n_clusters
    const filename = document.getElementById('dataset').value;
    const n_clusters = document.getElementById('n_clusters').value;
    // reset n_clusters label to 0
    document.getElementById('step').innerHTML = 0;
    // redraw plot from scratch
    init(filename, n_clusters);
}

// utilities
async function post(url = "", data = {}) {
  const response = await fetch(url, {
    method: "POST", // Specify the method (POST)
    headers: {
      "Content-Type": "application/json", // Tell the server you're sending JSON
    },
    body: JSON.stringify(data), // Convert JS object to JSON string
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`); // Check for errors
  }
  return await response.json(); // Parse the JSON response
}