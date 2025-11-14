#target illustrator

// Persist UI between runs
#targetengine "MAGITechGraph"

(function () {
    // -------------- Utilities --------------
    function num(v, dflt) {
        var n = parseFloat(v);
        return isFinite(n) ? n : dflt;
    }

    function clamp(v, a, b) {
        return Math.max(a, Math.min(b, v));
    }

    function rgb(r, g, b) {
        return { r: clamp(Math.round(r), 0, 255), g: clamp(Math.round(g), 0, 255), b: clamp(Math.round(b), 0, 255) };
    }

    function loadIcon(filePath) {
        try {
            var f = File(filePath);
            if (f.exists) return ScriptUI.newImage(f);
        } catch (e) {}
        return null;
    }

    function jsonStringify(o) {
        // Simple JSON stringify for ExtendScript (safe for our data types)
        if (o === null) return "null";
        var t = typeof o;
        if (t === "number" || t === "boolean") return String(o);
        if (t === "string") return '"' + o.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
        if (o instanceof Array) {
            var arr = [];
            for (var i = 0; i < o.length; i++) arr.push(jsonStringify(o[i]));
            return "[" + arr.join(",") + "]";
        }
        // object
        var parts = [];
        for (var k in o) if (o.hasOwnProperty(k)) {
            parts.push(jsonStringify(String(k)) + ":" + jsonStringify(o[k]));
        }
        return "{" + parts.join(",") + "}";
    }

    function sendToIllustrator(code, onResult, onError) {
        var bt = new BridgeTalk();
        bt.target = "illustrator";
        bt.body = code;
        alert(code);
        bt.onResult = function (res) {
            try {
                if (onResult) onResult(res.body || "");
            } catch (e) {}
        };
        bt.onError = function (err) {
            try {
                if (onError) onError(err.body || String(err));
            } catch (e) {}
        };
        bt.send();
    }

    // -------------- Build UI --------------
    var win = new Window("window", "MAGITech", undefined, { resizeable: true });
    //win.orientation = "column";
    win.alignChildren = ["fill", "top"];

    // Optional icon folder (place your PNGs here)
    var iconFolder = File($.fileName).parent + "/icons/";

    var axisIcon = loadIcon(iconFolder + "axis.png");
    var pointIcon = loadIcon(iconFolder + "points.png");
    var eqnIcon  = loadIcon(iconFolder + "equation.png");
    var styleIcon= loadIcon(iconFolder + "styles.png");

    // Top tab bar with icon+label buttons
    var tabBar = win.add("group");
    tabBar.orientation = "row";
    tabBar.alignment = ["fill", "top"];

    // Content group acts like stacked panels
    var content = win.add("group");
    content.orientation = "stack";
    content.alignment = ["fill", "fill"];

    // Helper to make tab buttons and attach content groups
    var tabs = [];
    function makeTab(label, image) {
        var btn = tabBar.add("iconbutton", undefined, image);
        btn.text = label; // text shows beneath in some UIs; fallback for accessibility
        btn.size = [135, 48];
        btn.alignment = ["left", "top"];
        var grp = content.add("group");
        grp.orientation = "column";
        grp.alignChildren = ["fill", "top"];
        grp.visible = false;

        // Style the button on active/inactive (simple highlight)
        btn._setActive = function (active) {
            try {
                btn.helpTip = label + (active ? " (active)" : "");
            } catch (e) {}
        };
        tabs.push({ btn: btn, grp: grp, label: label });
        return grp;
    }

    function showTab(i) {
        for (var j = 0; j < tabs.length; j++) {
            tabs[j].grp.visible = (j === i);
            tabs[j].btn._setActive(j === i);
        }
        win.layout.layout(true);
    }

    // ----- Axis Editor Tab -----
    var axisGrp = makeTab("Axis Editor", axisIcon);
    (function buildAxisEditor(p) {
    // --- 2. Add Width and Height inputs (Top Section) ---
        p.alignment = "left";
        var sizeGroup = p.add("group");
        sizeGroup.orientation = "column";
        sizeGroup.alignChildren = ["fill", "top"];
        
        var widthGroup = sizeGroup.add("group");
        widthGroup.add("statictext", undefined, "Width (pts):").preferredSize = [80, 20];
        var axisWidth = widthGroup.add("edittext", undefined, "120");
        axisWidth.characters = 5;

        var heightGroup = sizeGroup.add("group");
        heightGroup.add("statictext", undefined, "Height (pts):").preferredSize = [80, 20];
        var axisHeight = heightGroup.add("edittext", undefined, "120");
        axisHeight.characters = 5;
        
//var red = winGraphics.newPen(winGraphics.BrushType.SOLID_COLOR, [0.5,0.5,0.5], 1);

        // Create header text for the X Options and Y Options Panels
        var optionsText = p.add("statictext", undefined, "Enter x- and y- ranges here");
        optionsText.alignment = "center";
       // optionsText.graphics.foregroundColor = red;

        // Create the X Options and Y Options Panels (Middle Section)
        var optionsGroup = p.add("group");
        optionsGroup.orientation = "row"; // Place panels side-by-side
        optionsGroup.alignChildren = ["fill", "top"];

        // --- X Options Panel ---
        var xPanel = optionsGroup.add("panel", undefined, "X Options");
        xPanel.orientation = "column";
        xPanel.alignChildren = ["fill", "top"];
        xPanel.margins = 10;

        var gXMin = xPanel.add("group");
        gXMin.add("statictext", undefined, "Minimum:").preferredSize = [80, 20];
        var xMin = gXMin.add("edittext", undefined, "-4");
        xMin.characters = 5;

        var gXMax = xPanel.add("group");
        gXMax.add("statictext", undefined, "Maximum:").preferredSize = [80, 20];
        var xMax = gXMax.add("edittext", undefined, "4");
        xMax.characters = 5;

        var gXStep = xPanel.add("group");
        gXStep.add("statictext", undefined, "Step (scale):").preferredSize = [80, 20];
        var xStep = gXStep.add("edittext", undefined, "1");
        xStep.characters = 5;


        // --- Y Options Panel ---
        var yPanel = optionsGroup.add("panel", undefined, "Y Options");
        yPanel.orientation = "column";
        yPanel.alignChildren = ["fill", "top"];
        yPanel.margins = 10;

        var gYMin = yPanel.add("group");
        gYMin.add("statictext", undefined, "Minimum:").preferredSize = [80, 20];
        var yMin = gYMin.add("edittext", undefined, "-4");
        yMin.characters = 5;

        var gYMax = yPanel.add("group");
        gYMax.add("statictext", undefined, "Maximum:").preferredSize = [80, 20];
        var yMax = gYMax.add("edittext", undefined, "4");
        yMax.characters = 5;

        var gYStep = yPanel.add("group");
        gYStep.add("statictext", undefined, "Step (scale):").preferredSize = [80, 20];
        var yStep = gYStep.add("edittext", undefined, "1");
        yStep.characters = 5;

        p.getValues = function () {alert("vvvvvvvvvvv"+xMin.text);
            return {
                axisWidth: num(axisWidth.text, 120),
                axisHeight: num(axisHeight.text, 120),
                xMin: num(xMin.text, -10),
                xMax: num(xMax.text, 10),
                xStep: num(xStep.text, 1),
                yMin: num(yMin.text, -10),
                yMax: num(yMax.text, 10),
                yStep: num(yStep.text, 1)
            };
        };
    })(axisGrp);

    // ----- Point Editor Tab -----
    var pointGrp = makeTab("Point Editor", pointIcon);
    (function buildPointEditor(p) {
        var row = p.add("group");
        row.alignChildren = ["fill", "fill"];
        var list = row.add("listbox", undefined, [], { multiselect: true });
        list.preferredSize = [300, 150];

        var side = row.add("group");
        side.orientation = "column";
        side.alignment = ["left", "top"];

        var xRow = side.add("group");
        xRow.add("statictext", undefined, "x:");
        var xEdit = xRow.add("edittext", undefined, "0"); xEdit.characters = 7;

        var yRow = side.add("group");
        yRow.add("statictext", undefined, "y:");
        var yEdit = yRow.add("edittext", undefined, "0"); yEdit.characters = 7;

        var btnAdd = side.add("button", undefined, "Add Point");
        var btnRemove = side.add("button", undefined, "Remove Selected");

        btnAdd.onClick = function () {
            var x = num(xEdit.text, 0), y = num(yEdit.text, 0);
            list.add("item", "(" + x + ", " + y + ")");
            list.items[list.items.length - 1]._pt = { x: x, y: y };
        };
        btnRemove.onClick = function () {
            for (var i = list.selection ? list.selection.length - 1 : -1; i >= 0; i--) {
                list.selection[i].remove();
            }
        };

        p.getValues = function () {
            var pts = [];
            for (var i = 0; i < list.items.length; i++) pts.push(list.items[i]._pt);
            return { points: pts };
        };
    })(pointGrp);

    // ----- Equation Editor Tab -----
    var eqnGrp = makeTab("Equation Editor", eqnIcon);
    (function buildEquationEditor(p) {
        var g1 = p.add("group");
        g1.add("statictext", undefined, "f(x) =");
        var fx = g1.add("edittext", undefined, "sin(x)");
        fx.characters = 30;
        g1.add("statictext", undefined, "Samples:");
        var samples = g1.add("edittext", undefined, "400"); samples.characters = 5;

        var g2 = p.add("group");
        g2.add("statictext", undefined, "From x:");
        var fromX = g2.add("edittext", undefined, "-6.283"); fromX.characters = 8; // -2π approx
        g2.add("statictext", undefined, "to:");
        var toX = g2.add("edittext", undefined, "6.283"); toX.characters = 8; // +2π

        p.getValues = function () {
            return {
                functionExpr: fx.text || "",
                xStart: num(fromX.text, -6.283),
                xEnd: num(toX.text, 6.283),
                samples: Math.max(2, Math.floor(num(samples.text, 400)))
            };
        };
    })(eqnGrp);

    // ----- Styles Editor Tab -----
    var styleGrp = makeTab("Styles Editor", styleIcon);
    (function buildStylesEditor(p) {
        function makeColorRow(title, def) {
            var row = p.add("group");
            row.add("statictext", undefined, title + " RGB:");
            var r = row.add("edittext", undefined, String(def.r)); r.characters = 4;
            var g = row.add("edittext", undefined, String(def.g)); g.characters = 4;
            var b = row.add("edittext", undefined, String(def.b)); b.characters = 4;
            return { r: r, g: g, b: b, get: function () { return rgb(num(r.text, def.r), num(g.text, def.g), num(b.text, def.b)); } };
        }
        var axisColorRow = makeColorRow("Axis", { r: 40, g: 40, b: 40 });
        var gridColorRow = makeColorRow("Grid", { r: 200, g: 200, b: 200 });
        var pointColorRow = makeColorRow("Point", { r: 200, g: 50, b: 50 });
        var curveColorRow = makeColorRow("Curve", { r: 50, g: 80, b: 200 });

        var wRow = p.add("group");
        wRow.add("statictext", undefined, "Axis width:");
        var axisW = wRow.add("edittext", undefined, "1"); axisW.characters = 3;
        wRow.add("statictext", undefined, "Grid width:");
        var gridW = wRow.add("edittext", undefined, "0.5"); gridW.characters = 3;
        wRow.add("statictext", undefined, "Point size:");
        var ptSize = wRow.add("edittext", undefined, "3"); ptSize.characters = 3;
        wRow.add("statictext", undefined, "Curve width:");
        var curveW = wRow.add("edittext", undefined, "1.5"); curveW.characters = 3;

        p.getValues = function () {
            return {
                axisColor: axisColorRow.get(),
                gridColor: gridColorRow.get(),
                pointColor: pointColorRow.get(),
                curveColor: curveColorRow.get(),
                axisWidth: num(axisW.text, 1),
                gridWidth: num(gridW.text, 0.5),
                pointSize: num(ptSize.text, 3),
                curveWidth: num(curveW.text, 1.5)
            };
        };
    })(styleGrp);

    // Tab hooks (click to switch)
    for (var i = 0; i < tabs.length; i++) (function (idx) {
        tabs[idx].btn.onClick = function () { showTab(idx); };
    })(i);
    showTab(0); // Default to Axis Editor

    // Bottom action bar
    var actionBar = win.add("group");
    actionBar.alignment = ["fill", "bottom"];
    var drawBtn = actionBar.add("button", undefined, "Draw in Illustrator");
    var clearBtn = actionBar.add("button", undefined, "Clear Graph Layer");
    var statusTxt = actionBar.add("statictext", undefined, "Ready");
    statusTxt.characters = 40;

    // -------------- Gather settings + BridgeTalk draw --------------
    function gatherPayload() {
        var axis = axisGrp.getValues();
        var pts = pointGrp.getValues();
        var eq = eqnGrp.getValues();
        var sty = styleGrp.getValues();
        return {
            axis: axis,
            points: pts.points,
            equation: eq,
            styles: sty,
            meta: { layerName: "MAGITech-Graph" }
        };
    }

    function buildIllustratorScript(payload) {
        var json = jsonStringify(payload); // embed data
        var SCRIPT_FOLDER = (new File($.fileName)).parent;
        var functionsFile = new File(SCRIPT_FOLDER + "/plotFunctions/DrawingFunctions.jsx");

        if (!functionsFile.exists) {
            alert("DrawingFunctions.jsx not found!");
            return;
        }// 2. Read the file content into a string
        functionsFile.open("r");
        var functionsString = functionsFile.read();
        functionsFile.close();
        // The AI-side script runs in Illustrator; produces a layer and draws vector items.
        var code = functionsString + "\n";
        code += "var payload = " + json + ";\n";
        code += "drawGraph(payload);\n"
  
        /*
        var code =
"(function(){
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
    var payload = " + json + ";
    drawGraph(payload);
})();";
*/
        return code;
    }

    drawBtn.onClick = function () {
        var payload = gatherPayload();

alert("Data---" + payload.axis.axisWidth + "," + payload.axis.axisHeight + "," + payload.axis.xMin + "\n," + payload.axis.xMax);
        // Basic validation
        if (payload.axis.xMax <= payload.axis.xMin || payload.axis.yMax <= payload.axis.yMin) {
            statusTxt.text = "Invalid axis ranges.";
            return;
        }

        statusTxt.text = "Sending to Illustrator…";
        var code = buildIllustratorScript(payload);

        sendToIllustrator(code, function (res) {
            statusTxt.text = "Draw: " + res;
        }, function (err) {
            statusTxt.text = "Error: " + err;
        });
        statusTxt.text = code;
    };

    clearBtn.onClick = function () {
        var layerName = "MAGITech-Graph";
        var code =
        "(function(){\n\
    function ensureDoc(){ if (app.documents.length===0){ return null; } return app.activeDocument; }\n\
    var doc = ensureDoc(); if (!doc) { return 'No document'; }\n\
    for (var i=doc.layers.length-1;i>=0;i--){ if (doc.layers[i].name==='MAGITech-Graph'){ doc.layers[i].remove(); return 'Cleared'; } }\n\
    return 'Layer not found';\n\
        })();";
        statusTxt.text = "Clearing…";
        sendToIllustrator(code, function (res) { statusTxt.text = res; }, function (err) { statusTxt.text = "Error: " + err; });
    };

    // Resize handling
    win.onResizing = win.onResize = function () { win.layout.resize(); };

    // Show palette
    win.center();
    win.show();
})();
