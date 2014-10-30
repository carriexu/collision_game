//first set the width and height of the container, the dimensions of the visualization
var width = 960,
    height = 700;

// .range is a method that geerate a range of numeric values
// d3.range(200) returns an array, and .map creates a new array with the results of calling a function on every element in this array
// here the function is returning a new array with 200 random numbers for the radius

var nodes = d3.range(200).map(function() { return {radius: Math.random() * 12 + 4}; }),

// setting root to the first node from the nodes array
    root = nodes[0],
// scales are functions that map from an input domain to an output range
// ordinal scales rank things that are not necessarily numbers, such as a set of names or categories
// d3.scale.category10 returns a range of ten categotical colors
// there is also 20, 20b, 20c
// note that a scale object, such as that returned by d3.scale.ordinal, is both an object and a function. We can call the scale like any other function, and the scale has additional methods that change its behavior.
    color = d3.scale.category20();

root.radius = 0;
// setting the fixed property on the root to true means that the root now can ignore the force
root.fixed = true;

// d3.layout.force() constructs a new force-directed layout with default settings.

var force = d3.layout.force()
// force.gravity(), if gravity is specified, sets the gravitational strength to the specified value, if gravity is not specified, it returns the default value 0.1
// the gravity here is not the gravity in physics, because it isn't a force pushing downwards. Instead, it is a force that can push nodes towards the center of the layout
    .gravity(0.05)
// charge here is a function that is evaluated for each node (in order) and the return value is then used to set each node's charge. A negative value results in node repulsion, while a positive value results in node attractive.
    .charge(function(d, i) { return i ? 0 : -2000; })
//  sets the layout's associated nodes to the nodes array (see above), each node has the following attributes:
// index: the zero-based index of the node within the nodes array
// x -  the x coordinate of the current node position
// y: the y coordinate of the current node position
// px: the x coordinate of the previous node position
// py: the y coordinate of the previous node position
    .nodes(nodes)
    .size([width, height]);

// starts the cimulation, this must be called when the layout is first created.
force.start();

// here we create an svg container for the visualization
var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

// selects all the circles, which at this point, there is none, and joins the data (nodes.slice(1)) with the selection
// In d3, a selection is an array of elements pulled from the current document.
var dataset = [10, 10, 14, 20, 25, 11, 25, 22, 18, 8];

svg.selectAll("circle")
// selection.data([value[,key]]) joins the specified array of data with the current selection
// values is an array of data values, or a function that returns an array of values
// nodes.slice(1) extracts the second element
    .data(nodes.slice(1))
// returns the enter selection: placeholder nodes for each data element for which no corresponding existing DOM element was found in the current selection
  .enter().append("circle")

// set r to the data selection radius
    .attr("r", function(d) {
      return d.radius; })
// set the color of the circle to the color category we specified in the color category, i % 200
    .style("fill", function(d, i) {
      return color(i % 200); });


// tick is basically step of the physical simulation
force.on("tick", function(e) {
// creates a new quadtree factory with the default x-accessor, y-accessor, and extent
// a quadtree is a tree data structure in which each internal nodes has exactly four children.
// Quadtrees are most often used to partition a two dimentional-space by recursively subdividing it into four quadrants or regions. Useful for collision detection
// q is an object with nodes: Array[4], and each element in that array also has nodes: Array[4], and goes on and on...

  var q = d3.geom.quadtree(nodes),
      i = 0,
      n = nodes.length;

// .visit(callback)
// Visits each node in the quadtree, invoking the specified callback with arguments {node, x1, y1, x2, y2} for each node. Nodes are traversed in pre-order. If the callback returns true for a the given node, then the children of that node are not visited; otherwise, all child nodes are visited.
// ++i increase the value of i by 1 then use in statement
  while (++i < n) q.visit(collide(nodes[i]));

  svg.selectAll("circle")
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });

});

svg.on("mousemove", function() {
  // this is the svg
  // p1 captures the x, y coordinates of the mouse's current location on the screen
  var p1 = d3.mouse(this);
  // set the root element, which is the node that is not controlled by the force layout, and set its x, y coordinates to that of the mouse's
  root.px = p1[0];
  root.py = p1[1];
  // resume is the same as force.alpha(.1);
  // which sets the internal alpha parameter to 0.1, and then restarts the timer.
  // alpha controls the layout temperature, as the physical simulation converges on a stable layout, the temperature drops, causing the nodes to move more slowly. Eventually alpha drops below a threshold and the simulation stops completely.
  // basically, it starts by default at 0.1, then it decreases until it's really small. At the start of the simulation, the nodes move relatively quickly, then when it's almost over, the nodes move slower
  force.resume();
});

function collide(node) {
  // below we calculate the circle's boundaries
  var r = node.radius + 16,
      nx1 = node.x - r,
      nx2 = node.x + r,
      ny1 = node.y - r,
      ny2 = node.y + r;
  return function(quad, x1, y1, x2, y2) {
    if (quad.point && (quad.point !== node)) {
      var x = node.x - quad.point.x,
          y = node.y - quad.point.y,
          l = Math.sqrt(x * x + y * y),
          r = node.radius + quad.point.radius;
      if (l < r) {
        l = (l - r) / l * .5;
        node.x -= x *= l;
        node.y -= y *= l;
        quad.point.x += x;
        quad.point.y += y;
      }
    }
    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
  };
}
