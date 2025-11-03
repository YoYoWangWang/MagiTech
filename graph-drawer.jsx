
// Core functions to create a document and draw a circle in Illustrator
// -------------------------------------------------------------

#target illustrator

// Namespace
var Circle = Circle || {};

/**
 * Create an RGB document with given width/height (in points).
 * @param {Number} width
 * @param {Number} height
 * @param {String} name Optional document name
 * @returns {Document}
 */
Circle.createDocument = function (width, height, name) {
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        throw new Error("Invalid artboard size.");
    }
    var doc = app.documents.add(DocumentColorSpace.RGB, width, height);
    try {
        doc.rulerUnits = RulerUnits.Points;
        if (name) doc.name = name;
    } catch (e) {
        // Some versions may not allow name assignment here; ignore if so.
    }
    return doc;
};

/**
 * Returns the center point of the first artboard as { x, y }.
 * Illustrator artboard rect is [left, top, right, bottom].
 * For a rect [0, H, W, 0], center is (W/2, H/2).
 * @param {Document} doc
 */
Circle.centerOfFirstArtboard = function (doc) {
    var rect = doc.artboards[0].artboardRect; // [L, T, R, B]
    var cx = (rect[0] + rect[2]) / 2;
    var cy = (rect[1] + rect[3]) / 2;
    return { x: cx, y: cy };
};

/**
 * Make an RGBColor object.
 * @param {Number} r 0-255
 * @param {Number} g 0-255
 * @param {Number} b 0-255
 * @returns {RGBColor}
 */
Circle.rgb = function (r, g, b) {
    var c = new RGBColor();
    c.red = Math.max(0, Math.min(255, Math.round(r)));
    c.green = Math.max(0, Math.min(255, Math.round(g)));
    c.blue = Math.max(0, Math.min(255, Math.round(b)));
    return c;
};


/**
 * Make a CMYKColor object.
 * @param {Number} c 0-100
 * @param {Number} m 0-100
 * @param {Number} y 0-100
 * @param {Number} k 0-100
 * @returns {CMYKColor}
 */
Circle.cmyk = function (c, m, y, k) {
    var col = new CMYKColor();
    col.cyan = Math.max(0, Math.min(100, c));
    col.magenta = Math.max(0, Math.min(100, m));
    col.yellow = Math.max(0, Math.min(100, y));
    col.black = Math.max(0, Math.min(100, k));
    return col;
};


/**
 * Draw a circle centered at (cx, cy) with diameter (in points).
 * @param {Document} doc
 * @param {Number} cx center x
 * @param {Number} cy center y
 * @param {Number} diameter
 * @param {Number} strokeWeight
 * @param {RGBColor} strokeColor
 * @returns {PathItem} The created circle path
 */
Circle.drawCircle = function (doc, cx, cy, diameter, strokeWeight, strokeColor) {
    if (!doc) throw new Error("Document is required.");
    if (isNaN(diameter) || diameter <= 0) throw new Error("Invalid diameter.");
    if (isNaN(strokeWeight) || strokeWeight < 0) throw new Error("Invalid stroke weight.");

    // Illustrator ellipse() arguments: top, left, width, height
    var radius = diameter / 2;
    var top = cy + radius;
    var left = cx - radius;

    var circle = doc.pathItems.ellipse(top, left, diameter, diameter);
    circle.stroked = true;
    circle.strokeColor = strokeColor || Circle.cmyk(0, 0, 0,100);
    circle.strokeWidth = strokeWeight;
    circle.filled = false; // No fill per your requirement
    return circle;
};
