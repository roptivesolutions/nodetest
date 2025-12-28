const { app, BrowserWindow } = require("electron");
const path = require("path");

app.disableHardwareAcceleration(); // optional, removes VAAPI warnings

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
  });

  const indexPath = path.join(__dirname, "dist", "index.html");
  console.log("Loading:", indexPath);

  win.loadFile(indexPath);

  win.on("closed", () => {
    console.log("Window closed");
  });
}

app.whenReady().then(() => {
  console.log("App ready");
  createWindow();
});

app.on("window-all-closed", () => {
  console.log("All windows closed");
  if (process.platform !== "darwin") app.quit();
});

