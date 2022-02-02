# Segment Desktop CSV Uploader

This is a new and improved historical data importer for Segment. It provides a desktop UI to dynamically configure, transform, and preview CSV data as Segment events.




<img width="800" alt="Screen Shot 2022-01-24 at 10 03 57 PM" src="https://user-images.githubusercontent.com/11877780/150903437-7225d19d-0fce-403a-8dfd-88ef20229909.png">




<img width="800" alt="Screen Shot 2022-01-24 at 10 04 51 PM" src="https://user-images.githubusercontent.com/11877780/150903453-7a55392f-39ad-4e69-92e3-18427fbc08e2.png">



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
