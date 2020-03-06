const electron = require('electron')
const url = require('url')
const path = require('path')

const { app, BrowserWindow, Menu, ipcMain, Tray } = electron


process.env.NODE_ENV = 'production'

if(process.env.NODE_ENV == 'development') {
    require('electron-reload')(__dirname, {
        electron: require(`${__dirname}/node_modules/electron`),
        hardResetMethod: 'exit'
    });
}

let mainWindow, addWindow, statusWindow, trayIcon = null;

app.defQuit = false

// Listen for app to be ready
app.on('ready', () => {
    // Create new window
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    })
    // Load the HTML file into the window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'renderers', 'mainWindow.html'),
        protocol: 'file:',
        slashes: true,
        webPreferences: {
            nodeIntegration: true
        }
    }))

    // Quit app when close
    mainWindow.on('close', (e) => {
        if(!app.defQuit) {
            e.preventDefault()
            mainWindow.hide()
            if(addWindow) addWindow.hide()
        }
        else {
            app.quit()
        }
    })

    createStatusWindow()

    // Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
    // Insert the menu
    Menu.setApplicationMenu(mainMenu)
    //Tray
    trayIcon = new Tray(path.join(__dirname, "assets/icons/png/icon.png"))
    const trayMenu = Menu.buildFromTemplate(trayMenuTemplate)
    trayIcon.setContextMenu(trayMenu)
    trayIcon.setToolTip("Shopping List")
})

function createStatusWindow() {
    //Status Check
    statusWindow = new BrowserWindow({
        width: 0,
        height: 0,
        show: false,
        webPreferences: {
            nodeIntegration: true,
        }
    })
    statusWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'renderers', 'status.html'),
        protocol: 'file:',
        slashes: true
    }))
    statusWindow.on('close', ()=> {
        statusWindow = null
    })
    console.log("Created Status Check Window")
}

// Handle create add window
function createAddWindow() {
    addWindow = new BrowserWindow({
        width: 300,
        height: 200,
        title: 'Add Shopping List item',
        webPreferences: {
            nodeIntegration: true
        }
    })
    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'renderers', 'addWindow.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Garbage collection handle
    addWindow.on('close', () => {
        addWindow = null;
    })
}

// Catch item:add
ipcMain.on('item:add', (event, item) => {
    mainWindow.webContents.send('item:add', item)
    addWindow.close()
})

ipcMain.on('online-status-changed', (event, isOnline) => {
    mainWindow.webContents.send('online:statuschanged', isOnline)
    console.log(`[Main]: Status changed to ${isOnline}`);
})

// Tray Menu
const trayMenuTemplate = [
    {
        label: "Restore",
        click() {
            mainWindow.show()
        }
    },
    {
        label: 'Quit',
        click() {
            app.defQuit = true
            app.quit()
        }
    }
]

// Create Menu Template
const mainMenuTemplate = [
    {
        label: "File",
        submenu: [
            {
                label: 'Add Item',
                accelerator: process.platform == 'darwin' ? 'Command+N' : 'Ctrl+N',
                click() {
                    createAddWindow()
                }
            },
            {
                label: 'Clear Items',
                accelerator: process.platform == 'darwin' ? 'Command+/' : "Ctrl+/",
                click() {
                    mainWindow.webContents.send('item:clear')
                }
            },
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click() {
                    app.defQuit = true
                    app.quit()
                }
            }
        ]
    }
]

// If mac, add empty object to menu
if(process.platform == 'darwin') {
    mainMenuTemplate.unshift({})
}

// Add developer tools item if not in production (currently not checking)
if(process.env.NODE_ENV != '') {
    mainMenuTemplate.push({
        label: 'DevTools',
        submenu: [
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+I' : "Ctrl+Shift+I",
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools()
                }
            },
             {
                 role: 'reload'
             }
        ]
    })
}