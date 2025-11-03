
// -------------------------------------------------------------
// ScriptUI form to collect user inputs and call circle-drawer.jsx
// Adds a "Use active document" toggle.
// -------------------------------------------------------------

#target illustrator
#strict on

// Ensure the helper file is in the same folder as this UI file
#include "graph-drawer.jsx"

/**
 * Parse a hex color like '#RRGGBB' or 'RRGGBB' or '#RGB'
 * Returns { r, g, b } or null if invalid.
 */
function parseHexColor(hex) {
    if (!hex) return null;
    var s = String(hex).replace(/^\s+|\s+$/g, "").replace(/^#/, "");
    if (s.length === 3) {
        s = s.replace(/./g, function (ch) { return ch + ch; }); // 'f0a' -> 'ff00aa'
    }
    if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
    var r = parseInt(s.substr(0, 2), 16);
    var g = parseInt(s.substr(2, 2), 16);
    var b = parseInt(s.substr(4, 2), 16);
    return { r: r, g: g, b: b };
}

(function showDialog() {
    var dlg = new Window("dialog", "Draw Circle");

    // --- Toggle Row ---
    var toggleGroup = dlg.add("group");
    toggleGroup.alignment = "left";
    var useActiveCb = toggleGroup.add("checkbox", undefined, "Use active document (don’t create new)");
    useActiveCb.value = (app.documents.length > 0); // default to active if available

    // --- Artboard Panel (for new document) ---
    var abPanel = dlg.add("panel", undefined, "Artboard (points, when creating new)");
    abPanel.alignChildren = "left";
    abPanel.margins = 12;

    var abGroup1 = abPanel.add("group");
    abGroup1.add("statictext", undefined, "Width:");
    var abWidth = abGroup1.add("edittext", undefined, "800");
    abWidth.characters = 8;

    var abGroup2 = abPanel.add("group");
    abGroup2.add("statictext", undefined, "Height:");
    var abHeight = abGroup2.add("edittext", undefined, "600");
    abHeight.characters = 8;

    // --- Circle Panel ---
    var circlePanel = dlg.add("panel", undefined, "Circle");
    circlePanel.alignChildren = "left";
    circlePanel.margins = 12;

    var diamGroup = circlePanel.add("group");
    diamGroup.add("statictext", undefined, "Diameter (pt):");
    var diameterEt = diamGroup.add("edittext", undefined, "90");
    diameterEt.characters = 8;

    var strokeGroup = circlePanel.add("group");
    strokeGroup.add("statictext", undefined, "Stroke weight (pt):");
    var strokeEt = strokeGroup.add("edittext", undefined, "1");
    strokeEt.characters = 6;

    var colorGroup = circlePanel.add("group");
    colorGroup.add("statictext", undefined, "Stroke color (hex, leave empty for CMYK 0,0,0,100):");
    var colorEt = colorGroup.add("edittext", undefined, "");
    colorEt.characters = 16;

    // --- Buttons ---
    var btnGroup = dlg.add("group");
    btnGroup.alignment = "right";
    var drawBtn = btnGroup.add("button", undefined, "Draw", { name: "ok" });
    var cancelBtn = btnGroup.add("button", undefined, "Cancel", { name: "cancel" });

    // --- Helpers ---
    function setArtboardInputsEnabled(enabled) {
        // Disabling panel typically cascades, but set children too for compatibility
        abPanel.enabled = enabled;
        abWidth.enabled = enabled;
        abHeight.enabled = enabled;
    }

    // Initialize enable state
    setArtboardInputsEnabled(!useActiveCb.value);

    useActiveCb.onClick = function () {
        setArtboardInputsEnabled(!useActiveCb.value);
    };

    // --- Behavior ---
    drawBtn.onClick = function () {
        try {
            var w = parseFloat(abWidth.text);
            var h = parseFloat(abHeight.text);
            var d = parseFloat(diameterEt.text);
            var sw = parseFloat(strokeEt.text);

            if (isNaN(d) || d <= 0) throw "Enter a valid circle diameter.";
            if (isNaN(sw) || sw < 0) throw "Enter a valid stroke weight (>= 0).";

            var col = null;
            var hex = String(colorEt.text || "").toString().replace(/^\s+|\s+$/g, '');
            if (hex.length > 0) {
                col = parseHexColor(hex);
                if (!col) throw "Enter a valid stroke color hex (e.g., #FF0000).";
            }

            var doc = null;
            var willUseActive = useActiveCb.value && app.documents.length > 0;

            if (willUseActive) {
                doc = app.activeDocument;
            } else {
                // If we’re not using active (or none open), we must validate artboard size
                if (isNaN(w) || w <= 0) throw "Enter a valid artboard width.";
                if (isNaN(h) || h <= 0) throw "Enter a valid artboard height.";
                doc = Circle.createDocument(w, h, "Circle " + w + "x" + h);
            }

            var ctr = Circle.centerOfFirstArtboard(doc);

            // Choose stroke color:
            // - If hex provided, use RGB from hex.
            // - Else default to CMYK(0,0,0,100).
            var strokeColor = null;
            if (col) {
                strokeColor = Circle.rgb(col.r, col.g, col.b);
            } else {
                strokeColor = Circle.cmyk(0, 0, 0, 100);
            }

            var circle = Circle.drawCircle(doc, ctr.x, ctr.y, d, sw, strokeColor);
            try { circle.selected = true; } catch (_) {}

            app.redraw();
            dlg.close(1);
        } catch (err) {
            alert("Cannot draw circle:\n" + err);
        }
    };

    cancelBtn.onClick = function () {
        dlg.close(0);
    };
    
dlg.center();
    dlg.show();
})();

