# Segment Desktop CSV Uploader

This is a new and improved historical data importer for Segment. It provides a desktop UI to configure a an import of CSV data as Segment events.

## App Architecture

This app is built with Electron and React. Electron has a multiprocess architecture where there is a main process, which spawns "renderer" processes for various tasks.

There are two renderer processes in this app, uiWindow and importerWindow. uiWindow contains the React App, and importerWindow acts as the "backend" doing all the heavy lifting computationally, formatting and importing the events.

The main process controls the lifecycle of the 2 renderer processes, as well as the communication between them via IPC (Inter process communication).


### Development

1.   `yarn install` to install dependencies
2.   `yarn start` to start the react development server
3.   `yarn electron-dev` to start electron

### Testing

1. `yarn test` Launches the test runner
