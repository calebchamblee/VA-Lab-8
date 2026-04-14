let svg = d3.select("svg#scatterplot")
  .attr("width", 500)
  .attr("height", 500)
  .style("background", "#fff");

let currentData = [];
let running = false;

// handles reset triggered by reset button or changing dropdowns
async function initializePlot() {
    // reset stops run
    running = false;
    // get filename and n_clusters
    const filename = document.getElementById('dataset').value;
    const n_clusters = document.getElementById('n_clusters').value;
    document.getElementById('step').innerHTML = 0;
    
    d3.csv(`static/datasets/${filename}.csv`, d3.autoType).then((data) => {
        currentData = data;
        
        // get data from backend
        post('/init', {
            data: data, 
            n_clusters: n_clusters
        }).then((result) => {
            // plot centroids and clusters
            renderCentroidInputs(result.centroids, true); 
            plot(data, result.centroids, result.labels);
        });
    });
}

// plot the centroid text boxes
function renderCentroidInputs(centroids, forceRedraw = false) {
    const container = d3.select("#inputs-container");
    const existing = container.selectAll("div");
    
    // no need to redraw boxes if they've already been drawn (only on init or reset)
    if (!forceRedraw && existing.size() === centroids.length) {
        // update existing textboxes
        centroids.forEach((c, i) => {
            const cx = document.getElementById(`cx-${i}`);
            const cy = document.getElementById(`cy-${i}`);
            // Only update value if the user isn't currently typing in that box
            if (document.activeElement !== cx) cx.value = parseFloat(c[0]).toFixed(2);
            if (document.activeElement !== cy) cy.value = parseFloat(c[1]).toFixed(2);
        });
        return;
    }

    // otherwise, reset centroid textboxes (if n_clusters changes)
    container.html("");
    centroids.forEach((c, i) => {
        const div = container.append("div").style("display", "inline-block").style("margin", "5px");
        div.append("span").text(`C${i}: `);
        div.append("input").attr("type", "number").attr("step", "0.01").attr("id", `cx-${i}`).attr("value", c[0].toFixed(2)).style("width", "60px");
        div.append("input").attr("type", "number").attr("step", "0.01").attr("id", `cy-${i}`).attr("value", c[1].toFixed(2)).style("width", "60px");
    });
}

// get the centroids
function getManualCentroids() {
    // get num clusters
    const k = +document.getElementById('n_clusters').value;
    let centers = [];
    for(let i=0; i<k; i++) {
        // find centers of centroids that were set earlier
        const xVal = document.getElementById(`cx-${i}`).value;
        const yVal = document.getElementById(`cy-${i}`).value;
        centers.push([parseFloat(xVal) || 0, parseFloat(yVal) || 0]);
    }
    return centers;
}

// plot clusters
function plot(data, centroids, labels) {
    // define scales and margins
    const xExtent = d3.extent(data, d => d.x);
    const yExtent = d3.extent(data, d => d.y);
    const xMargin = (xExtent[1] - xExtent[0]) * 0.15;
    const yMargin = (yExtent[1] - yExtent[0]) * 0.15;

    const xScale = d3.scaleLinear().domain([xExtent[0] - xMargin, xExtent[1] + xMargin]).range([50, 450]);
    const yScale = d3.scaleLinear().domain([yExtent[0] - yMargin, yExtent[1] + yMargin]).range([450, 50]);
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    // reset plot and add back chart with updated points
    svg.selectAll("*").remove();
    svg.append("rect").attr("width", 400).attr("height", 400).attr("x", 50).attr("y", 50).attr("fill", "#eeeeee");

    svg.append("g").attr("transform", "translate(0,450)").call(d3.axisBottom(xScale).ticks(5).tickSize(-400).tickFormat("")).selectAll("line").attr("stroke", "white");
    svg.append("g").attr("transform", "translate(50,0)").call(d3.axisLeft(yScale).ticks(5).tickSize(-400).tickFormat("")).selectAll("line").attr("stroke", "white");

    // map color to assigned centroid
    svg.selectAll(".point").data(data).join("circle").attr("class", "point").attr("r", 3.5)
      .attr("cx", d => xScale(d.x)).attr("cy", d => yScale(d.y))
      .attr("fill", (d, i) => labels ? color(labels[i]) : "#777").attr("opacity", 0.9);

    // plot the points
    svg.selectAll(".centroid").data(centroids).join("circle").attr("class", "centroid").attr("r", 10)
      .attr("stroke", "white").attr("stroke-width", 2).attr("cx", d => xScale(d[0])).attr("cy", d => yScale(d[1])).attr("fill", (d, i) => color(i));
}

// run the Kmeans algorithms
async function runKmeans() {
    running = true;
    let converged = false;
    // run until converged or reset, then stop
    while (!converged && running) {
        // get centroids and then result data from backend
        const centroids = getManualCentroids();
        const result = await post('/step_forward', {data: currentData});
        converged = result.converged;
        // only rename label and plot if still not converged
        if (!converged) {
            // increment step label
            document.getElementById('step').innerHTML = result.step;
            renderCentroidInputs(result.centroids);
            plot(currentData, result.centroids, result.labels);
            // buffer so user sees update
            await new Promise(r => setTimeout(r, 200));
        }
    }
    running = false;
}

// user presses forward
async function stepForward() {
    // get the data from backend
    const result = await post('/step_forward', {data: currentData});
    // only step if not converged
    if (!result.converged) {
        // update label, plot centroids and clusters
        document.getElementById('step').innerHTML = result.step;
        renderCentroidInputs(result.centroids);
        plot(currentData, result.centroids, result.labels);
    }
}

// user presses back
async function stepBack() {
 // get the data from backend (centroids )
    const result = await post('/step_backward', {data: currentData});
    if (+(document.getElementById('step').innerHTML > 0)) {
        // update label, plot centroids and clusters
        document.getElementById('step').innerHTML = result.step;
        renderCentroidInputs(result.centroids);
        plot(currentData, result.centroids, result.labels);
    }
}

// utilities
async function post(url, data) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return await response.json();
}

// start out by plotting
initializePlot();