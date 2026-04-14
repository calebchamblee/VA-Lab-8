let svg = d3.select("svg#scatterplot")
  .attr("width", 500)
  .attr("height", 500)
  .style("background", "#fff");

let currentData = [];

async function initializePlot() {
    const filename = document.getElementById('dataset').value;
    const n_clusters = document.getElementById('n_clusters').value;
    document.getElementById('step').innerHTML = 0;
    
    d3.csv(`static/datasets/${filename}.csv`, d3.autoType).then((data) => {
        currentData = data;
        
        post('/init', {
            data: data, 
            n_clusters: n_clusters
        }).then((result) => {
            renderCentroidInputs(result.centroids, true); 
            plot(data, result.centroids, result.labels);
        });
    });
}

function renderCentroidInputs(centroids, forceRedraw = false) {
    const container = d3.select("#inputs-container");
    const existing = container.selectAll("div");
    
    if (!forceRedraw && existing.size() === centroids.length) {
        centroids.forEach((c, i) => {
            const cx = document.getElementById(`cx-${i}`);
            const cy = document.getElementById(`cy-${i}`);
            // Only update value if the user isn't currently typing in that box
            if (document.activeElement !== cx) cx.value = parseFloat(c[0]).toFixed(2);
            if (document.activeElement !== cy) cy.value = parseFloat(c[1]).toFixed(2);
        });
        return;
    }

    container.html("");
    centroids.forEach((c, i) => {
        const div = container.append("div").style("display", "inline-block").style("margin", "5px");
        div.append("span").text(`C${i}: `);
        div.append("input").attr("type", "number").attr("step", "0.01").attr("id", `cx-${i}`).attr("value", c[0].toFixed(2)).style("width", "60px");
        div.append("input").attr("type", "number").attr("step", "0.01").attr("id", `cy-${i}`).attr("value", c[1].toFixed(2)).style("width", "60px");
    });
}

function getManualCentroids() {
    const k = +document.getElementById('n_clusters').value;
    let centers = [];
    for(let i=0; i<k; i++) {
        const xVal = document.getElementById(`cx-${i}`).value;
        const yVal = document.getElementById(`cy-${i}`).value;
        centers.push([parseFloat(xVal) || 0, parseFloat(yVal) || 0]);
    }
    return centers;
}

function plot(data, centroids, labels) {
    const xExtent = d3.extent(data, d => d.x);
    const yExtent = d3.extent(data, d => d.y);
    const xMargin = (xExtent[1] - xExtent[0]) * 0.15;
    const yMargin = (yExtent[1] - yExtent[0]) * 0.15;

    const xScale = d3.scaleLinear().domain([xExtent[0] - xMargin, xExtent[1] + xMargin]).range([50, 450]);
    const yScale = d3.scaleLinear().domain([yExtent[0] - yMargin, yExtent[1] + yMargin]).range([450, 50]);
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    svg.selectAll("*").remove();
    svg.append("rect").attr("width", 400).attr("height", 400).attr("x", 50).attr("y", 50).attr("fill", "#eeeeee");

    svg.append("g").attr("transform", "translate(0,450)").call(d3.axisBottom(xScale).ticks(5).tickSize(-400).tickFormat("")).selectAll("line").attr("stroke", "white");
    svg.append("g").attr("transform", "translate(50,0)").call(d3.axisLeft(yScale).ticks(5).tickSize(-400).tickFormat("")).selectAll("line").attr("stroke", "white");

    svg.selectAll(".point").data(data).join("circle").attr("class", "point").attr("r", 3.5)
      .attr("cx", d => xScale(d.x)).attr("cy", d => yScale(d.y))
      .attr("fill", (d, i) => labels ? color(labels[i]) : "#777").attr("opacity", 0.9);

    svg.selectAll(".centroid").data(centroids).join("circle").attr("class", "centroid").attr("r", 10)
      .attr("stroke", "white").attr("stroke-width", 2).attr("cx", d => xScale(d[0])).attr("cy", d => yScale(d[1])).attr("fill", (d, i) => color(i));
}

async function runKmeans() {
    let converged = false;
    while (!converged) {
        const centroids = getManualCentroids();
        const result = await post('/step_forward', {data: currentData, centroids: centroids});
        
        // Update the UI
        converged = result.converged;
        document.getElementById('step').innerHTML = result.step;
        renderCentroidInputs(result.centroids);
        plot(currentData, result.centroids, result.labels);
        
        // If it converged, stop the loop immediately
        if (converged) {
            console.log("Converged!");
            break;
        }
        
        // Wait 200ms so the user sees the animation
        await new Promise(r => setTimeout(r, 200)); 
    }
}

async function stepForward() {
    const centroids = getManualCentroids();
    const result = await post('/step_forward', {data: currentData, centroids: centroids});
    document.getElementById('step').innerHTML = result.step;
    renderCentroidInputs(result.centroids);
    plot(currentData, result.centroids, result.labels);
}

async function stepBack() {
    const result = await post('/step_backward', {data: currentData});
    document.getElementById('step').innerHTML = result.step;
    renderCentroidInputs(result.centroids);
    plot(currentData, result.centroids, result.labels);
}

async function post(url, data) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return await response.json();
}

initializePlot();