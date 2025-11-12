// DrawingFunctions.jsx - This file contains the functions to run in Illustrator
function drawGraphInAI(strokeWidth, radius, size, color) {
    if (app.documents.length === 0) {
        alert("No active document!");
        return;
    }
alert("kkkkkkkkkkk");
    var doc = app.activeDocument;
    
    // Clear previous drawing (if any) or find and update existing items
    // This is a basic example; sophisticated handling needed for refresh
    var existingItems = doc.pathItems;
    for (var i = existingItems.length - 1; i >= 0; i--) {
        if (existingItems[i].name === "MyGraphItem") {
            existingItems[i].remove();
        }
    }

    // *** YOUR DRAWING LOGIC HERE ***
    var newCircle = doc.pathItems.ellipse(100, 100, radius, size, false, true); // Top, Left, Width, Height
    newCircle.name = "MyGraphItem"; // Add a name to identify it later

    // Apply settings
    newCircle.strokeWidth = strokeWidth;
    newCircle.stroked = true;
    newCircle.filled = false; // Example: no fill

    // Apply color (example with a simple black color)
    var blackColor = new GrayColor();
    blackColor.gray = 100;
    newCircle.strokeColor = blackColor;
    
    app.redraw();
}
