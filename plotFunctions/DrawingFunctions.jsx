// DrawingFunctions.jsx - This file contains the functions to run in Illustrator
    function rgbColor(r,g,b){ var c = new RGBColor(); c.red=r; c.green=g; c.blue=b; return c; }
    function ensureDoc(){ if (app.documents.length===0){ app.documents.add(DocumentColorSpace.RGB); } return app.activeDocument; }
    function getActiveArtboardRect(doc){ var idx = doc.artboards.getActiveArtboardIndex(); return doc.artboards[idx].artboardRect; }
    function mapCoord(ax, ay, rect, axis){
        var left=rect[0], top=rect[1], right=rect[2], bottom=rect[3];
        var W = right - left; var H = top - bottom;
        var tX = (ax - axis.xMin) / (axis.xMax - axis.xMin); var tY = (ay - axis.yMin) / (axis.yMax - axis.yMin);
        var x = left + tX * W;
        var y = top - tY * H; // invert Y for math -> Illustrator
        return [x, y];
    }
    function drawLine(doc, layer, p1, p2, stroke, width){
        var path = layer.pathItems.add();
        path.stroked = true; path.filled = false; path.strokeWidth = width;
        path.strokeColor = stroke;
        path.setEntirePath([p1, p2]);
        return path;
    }
    function drawPolyline(doc, layer, pts, stroke, width){
        if (pts.length<2) return null;
        var path = layer.pathItems.add();
        path.stroked=true; path.filled=false; path.strokeWidth=width; path.strokeColor=stroke;
        path.setEntirePath(pts);
        return path;
    }
    function drawPoint(layer, p, color, size){
        // Draw small circle to represent a point
        var radius = size; // points
        var left = p[0]-radius, top = p[1]+radius;
        var ellipse = layer.pathItems.ellipse(top, left, radius*2, radius*2);
        ellipse.stroked = true; ellipse.strokeWidth = 0.75; ellipse.strokeColor = color; ellipse.filled = true; ellipse.fillColor = color;
        return ellipse;
    }
    function safeEval(expr, x){
        // Very basic evaluator: replaces 'x' with numeric literal and evals.
        // Supports Math-like functions (sin,cos,tan,exp,log,abs,pow,min,max).
        // WARNING: Do not run untrusted expressions.
        var env = 'var sin=Math.sin,cos=Math.cos,tan=Math.tan,asin=Math.asin,acos=Math.acos,atan=Math.atan,exp=Math.exp,log=Math.log,abs=Math.abs,pow=Math.pow,min=Math.min,max=Math.max,sqrt=Math.sqrt,PI=Math.PI,E=Math.E;';
        var s = '('+expr+')';
        s = s.replace(/\\bx\\b/g, '('+x+')');
        return eval(env + s);
    }
    function drawGraph(payload){
        var doc = ensureDoc();
        var layerName = payload.meta && payload.meta.layerName ? payload.meta.layerName : 'MAGITech-Graph';
        var layer = (function(){
            for (var i=0;i<doc.layers.length;i++){ if (doc.layers[i].name===layerName) return doc.layers[i]; }
            var ly = doc.layers.add(); ly.name = layerName; return ly;
        })();
        var rect = getActiveArtboardRect(doc);
        var axis = payload.axis, styles = payload.styles;
        var axisColor = rgbColor(styles.axisColor.r, styles.axisColor.g, styles.axisColor.b);
        var gridColor = rgbColor(styles.gridColor.r, styles.gridColor.g, styles.gridColor.b);
        var curveColor = rgbColor(styles.curveColor.r, styles.curveColor.g, styles.curveColor.b);
        var ptColor = rgbColor(styles.pointColor.r, styles.pointColor.g, styles.pointColor.b);
        // Grid
        if (axis.showGrid){
            var ticks = Math.max(0, payload.axis.tickCount|0);
            if (ticks>0){
                for (var i=0;i<=ticks;i++){
                    var tx = axis.xMin + (axis.xMax-axis.xMin)*i/ticks;
                    var p1 = mapCoord(tx, axis.yMin, rect, axis);
                    var p2 = mapCoord(tx, axis.yMax, rect, axis);
                    drawLine(doc, layer, p1, p2, gridColor, styles.gridWidth);
                    var ty = axis.yMin + (axis.yMax-axis.yMin)*i/ticks;
                    var p3 = mapCoord(axis.xMin, ty, rect, axis);
                    var p4 = mapCoord(axis.xMax, ty, rect, axis);
                    drawLine(doc, layer, p3, p4, gridColor, styles.gridWidth);
                }
            }
        }
        // Axes lines (x=0 and y=0 if in range)
        if (axis.xMin<0 && axis.xMax>0){
            var p1 = mapCoord(0, axis.yMin, rect, axis);
            var p2 = mapCoord(0, axis.yMax, rect, axis);
            drawLine(doc, layer, p1, p2, axisColor, styles.axisWidth);
        }
        if (axis.yMin<0 && axis.yMax>0){
            var p3 = mapCoord(axis.xMin, 0, rect, axis);
            var p4 = mapCoord(axis.xMax, 0, rect, axis);
            drawLine(doc, layer, p3, p4, axisColor, styles.axisWidth);
        }
        // Ticks along axes
        if (payload.axis.showTicks){
            var ticks = Math.max(0, payload.axis.tickCount|0);
            if (ticks>0){
                var tickSize = 5; // points long
                if (axis.xMin<0 && axis.xMax>0){
                    for (var i=0;i<=ticks;i++){
                        var ty = axis.yMin + (axis.yMax-axis.yMin)*i/ticks;
                        var c = mapCoord(0, ty, rect, axis);
                        drawLine(doc, layer, [c[0]-tickSize, c[1]], [c[0]+tickSize, c[1]], axisColor, styles.axisWidth);
                    }
                }
                if (axis.yMin<0 && axis.yMax>0){
                    for (var j=0;j<=ticks;j++){
                        var tx = axis.xMin + (axis.xMax-axis.xMin)*j/ticks;
                        var c2 = mapCoord(tx, 0, rect, axis);
                        drawLine(doc, layer, [c2[0], c2[1]-tickSize], [c2[0], c2[1]+tickSize], axisColor, styles.axisWidth);
                    }
                }
            }
        }
        // Draw points
        if (payload.points && payload.points.length){
            for (var k=0;k<payload.points.length;k++){
                var pt = payload.points[k];
                var mp = mapCoord(pt.x, pt.y, rect, axis);
                drawPoint(layer, mp, ptColor, styles.pointSize);
            }
        }
        // Draw function curve
        if (payload.equation && payload.equation.functionExpr){
            var expr = String(payload.equation.functionExpr);
            var n = Math.max(2, payload.equation.samples|0);
            var xs = payload.equation.xStart, xe = payload.equation.xEnd;
            var pts = [];
            for (var i=0;i<n;i++){
                var t = i/(n-1);
                var x = xs + (xe-xs)*t;
                var y;
                try { y = safeEval(expr, x); } catch(e) { y = NaN; }
                if (isNaN(y) || !isFinite(y)) { continue; }
                pts.push(mapCoord(x,y,rect,axis));
            }
            drawPolyline(app.activeDocument, layer, pts, curveColor, styles.curveWidth);
        }
        return 'OK';
    }
