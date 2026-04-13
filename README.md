# VA-Lab-8
Kmeans clustering viz

Done (backend + frontend logic):

Flask routes: /init, /step_forward, /step_backward
K-means algorithm: label assignment, centroid update, convergence check, history management
Frontend controls: init, run, forward, backward, reset
Step counter updates
Dataset/n_clusters onchange handling

Left to do:

plot(data, labels, centroids) function — color points by cluster label, render centroids as larger markers as shown in handout
Centroid textboxes — dynamically create x/y input fields for each cluster, allow manual override, hook into /init with custom centroids (#2 in handout)
Wire plot calls into the // plot here comments in run, forward, backward, and init (see comments in script.js)
