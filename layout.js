/**
a layout on top of d3.pack layout to make circles visually more visible
**/
function d3CircleLayout(_nodes) {

    var nodes = _nodes;
    
    function CirclePair(node1, node2, priority) {

        this.c1 = node1;
        this.c2 = node2;
        this.gap = calcGap(node1, node2) * (priority ? priority : 1);
        this.gapCenterPoint = calcGapMiddle(node1, node2);;

        function calcGap(c1, c2) {

            var distance = Math.sqrt((c1.x - c2.x) * (c1.x - c2.x) + (c1.y - c2.y) * (c1.y - c2.y));
            return distance - c1.r - c2.r;

        };

        function calcGapMiddle(c1, c2) {

            var vX = c2.x - c1.x;
            var vY = c2.y - c1.y;
            var magV = Math.sqrt(vX * vX + vY * vY);
            var aX = c1.x + vX / magV * c1.r;
            var aY = c1.y + vY / magV * c1.r;

            vX = c1.x - c2.x;
            vY = c1.y - c2.y;
            magV = Math.sqrt(vX * vX + vY * vY);
            var aX2 = c2.x + vX / magV * c2.r;
            var aY2 = c2.y + vY / magV * c2.r;

            var gapCenterX = (aX + aX2) / 2;
            var gapCenterY = (aY + aY2) / 2;
            return {
                x: gapCenterX,
                y: gapCenterY
            };
        };

    }

    function CirclePeaks(node) {

        //peak points of main circle  //.707 means cos45
        this.peak_left = {
            x: node.x - node.r,
            y: node.y
        };
        this.peak_right = {
            x: node.x + node.r,
            y: node.y
        };
        this.peak_bottom = {
            x: node.x,
            y: node.y + node.r
        };
        this.peak_bottom_left = {
            x: (node.x - (node.r * .707)),
            y: (node.y + (node.r * .707))
        };
        this.peak_bottom_right = {
            x: (node.x + (node.r * .707)),
            y: (node.y + (node.r * .707))
        };
        this.peak_top = {
            x: node.x,
            y: node.y - node.r
        };
        this.peak_top_left = {
            x: (node.x - (node.r * .707)),
            y: (node.y - (node.r * .707))
        };
        this.peak_top_right = {
            x: (node.x + (node.r * .707)),
            y: (node.y - (node.r * .707))
        };

    }

    function moveBetween(t, a, b, angle0, angle1, main_circle) {

        var step = angle0 > angle1 ? -1 : 1;
        var x_org = t.x,
            y_org = t.y;
        while (angle0 != angle1) {

            angle0 += step;
            t.x = main_circle.x + (main_circle.r - t.r) * Math.cos(angle0 * Math.PI / 180);
            t.y = (main_circle.y - (main_circle.r - t.r) * Math.sin(angle0 * Math.PI / 180));

            if (!isIntersect(t, a) && !isIntersect(t, b)) {
                return;
            }
        }
        //revert to original position if not found a place.
        t.x = x_org;
        t.y = y_org;
    };

    function updatePositions(node, startIndex) {

        for (var i = startIndex; i < node.children.length; i++) {
            var t = node.children[i];
            var intersected = false;
            for (var j = 0; j < node.pairs.length; j++) {
                var pair = node.pairs[j];

                t.x = pair.gapCenterPoint.x;
                t.y = pair.gapCenterPoint.y;

                for (var k = 0; k < node.circles.length; k++) {
                    intersected = isIntersect(t, node.circles[k])
                    if (intersected) {
                        break;
                    }
                }
                if (!intersected) {

                    node.pairs.splice(j, 1); //no need this pair any more

                    updatePairs(i, t, node)

                    break;
                }
            }
            if (intersected) { //means no suitable place for circle try find place at peak points this is applicable for nodes has children less 13 
                moveToEdge(t, node, "TR");
                if (isAnyIntersect(t, node.children)) { //if there is still intersection try bottom right otherwise leave at bottom right 
                    moveToEdge(t, node, "BR");
                }
            }
        }
    }

    function updatePairs(startIndex, circle, node) {

        for (var l = startIndex - 1; l > 0; l--) {
            var n = node.children[l];
            if (circle.r > 15 || n.r > 15) {
                node.pairs.push(new CirclePair(circle, n));
            }
        }
        sortPairCircles(node);
        node.circles.push(circle);
    }

    function moveToEdge(circle, node, loc) {

        switch (loc) {
            case "L":
                circle.x = node.peaks.peak_left.x + circle.r;
                circle.y = node.peaks.peak_left.y;
                break;
            case "R":
                circle.x = node.peaks.peak_right.x - circle.r;
                circle.y = node.peaks.peak_right.y;
                break;
            case "T":
                circle.x = node.peaks.peak_top.x;
                circle.y = node.peaks.peak_top.y + circle.r;
                break;
            case "B":
                circle.x = node.peaks.peak_bottom.x;
                circle.y = node.peaks.peak_bottom.y - circle.r;
                break;
            case "TL":
                circle.x = node.peaks.peak_top_left.x + circle.r / 1.414;
                circle.y = node.peaks.peak_top_left.y + circle.r / 1.414;
                break;
            case "TR":
                circle.x = node.peaks.peak_top_right.x - circle.r / 1.414;
                circle.y = node.peaks.peak_top_right.y + circle.r / 1.414;
                break;
            case "BL":
                circle.x = node.peaks.peak_bottom_left.x + circle.r / 1.414;
                circle.y = node.peaks.peak_bottom_left.y - circle.r / 1.414;
                break;
            case "BR":
                circle.x = node.peaks.peak_bottom_right.x - circle.r / 1.414;
                circle.y = node.peaks.peak_bottom_right.y - circle.r / 1.414;
                break;
        }

    }

    /* Test intersection between two circles*/
    function isIntersect(a, b) {

        var dx = b.x - a.x,
            dy = b.y - a.y,
            dr = a.r + b.r;
        return .999 * dr * dr > dx * dx + dy * dy; // relative error within epsilon

    };
    /* Test intersection of circle against set of circles*/
    function isAnyIntersect(a, circles) {

        var intersect = false;
        for (var i = 0; i < circles.length; i++) {
            var b = circles[i];
            if (a.id !== b.id) intersect = isIntersect(a, b);
            if (intersect) return true;
        }
        return false;
    };

    function sortPairCircles(node) {
        node.pairs = node.pairs.sort(function(a, b) {
            return d3.descending(a.gap, b.gap);
        });
    }

    this.apply = function() {

        if (nodes.length < 3) {
            return;
        }

        nodes = nodes.sort(function(a, b) {
            return d3.descending(a.r, b.r);
        });

        for (var i = 0; i < nodes.length; i++) {

            var node = nodes[i];

            if (node.children) {
                processNode(node)
            }

        }

    }

    function processNode(node) {

        if (!node.peaks) {
            node.peaks = new CirclePeaks(node);
        }

        var subNodes = node.children.sort(function(a, b) {
            return d3.descending(a.r, b.r);
        });;

        var a = subNodes[0],
            b = subNodes[1],
            c = subNodes[2],
            d = subNodes[3];

        if (a) {
            moveToEdge(a, node, "L");
        }

        if (b) {
            moveToEdge(b, node, "R");
        }

        if (c) {
            moveToEdge(c, node, "T");
            if (isIntersect(a, c)) {
                moveBetween(c, a, b, 90, 0, node);
            }
        }

        if (d) {
            moveToEdge(d, node, "B");
            if (isIntersect(a, d)) {
                moveBetween(d, a, b, 270, 360, node);
            }
        }

        var startIndex = 4;

        if (subNodes.length > 13) {

            var e = subNodes[4],
                f = subNodes[5],
                g = subNodes[6],
                h = subNodes[7];

            if (e) {
                moveToEdge(e, node, "TL");
                if (isIntersect(a, e)) {
                    moveBetween(e, a, c, 180, 90, node);
                }
            }

            if (f) {
                moveToEdge(f, node, "TR");
            }

            if (g) {
                moveToEdge(g, node, "BL");
            }

            if (h) {
                moveToEdge(h, node, "BR");
            }
            var startIndex = 8;
        }

        //place rest of circles	
        if (subNodes.length > 4) {

            var pairs = [];
            var circles = [];

            pairs.push(new CirclePair(a, b));
            pairs.push(new CirclePair(a, c, 5));
            pairs.push(new CirclePair(a, d, 5));
            circles.push(a);

            pairs.push(new CirclePair(b, c, 5));
            pairs.push(new CirclePair(b, d, 5));
            circles.push(b);

            pairs.push(new CirclePair(c, d));
            circles.push(c);
            circles.push(d);

            node.circles = circles;
            node.pairs = pairs;

            sortPairCircles(node);

            updatePositions(node, startIndex);

        }

    }

}
