# Segment Desktop CSV Uploader

This is a new and improved historical data importer for Segment. It provides a UI to dynamically configure, transform, and import csv data as Segment events. 

### Using the app

Upload a csv from your local file system:
\
 <img width="70%" alt="Screen Shot 2022-01-24 at 10 03 57 PM" src="https://user-images.githubusercontent.com/11877780/150903437-7225d19d-0fce-403a-8dfd-88ef20229909.png">

Inspect a particular row to see QA the format of the Segment Events:
\
<img width="70%" alt="Screen Shot 2022-01-24 at 10 04 51 PM" src="https://user-images.githubusercontent.com/11877780/150903453-7a55392f-39ad-4e69-92e3-18427fbc08e2.png">


### Running the app

Run the following commands in your terminal:


1. clone the repository, e.g.:  
  `git clone https://github.com/segmentio/desktop-csv-uploader.git`

2. Navigate to the project root directory in your terminal, e.g.:  
  `cd desktop-csv-uploader` 

3. Run `npm install` to install dependencies 

4. Run `npm run build` to package via webpack and transpile the typescript   

5. Run `npm run client` to start the dev server  

6. Open http://localhost:8080 in your browser
