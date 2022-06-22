// Copyright 2022 Twilio Inc.

import * as express from 'express';
import {Request, Response} from 'express';
import * as path from 'path';

const app = express()
const port = process.env.PORT || 3000 

app.use(express.static('./build/client'));

app.get('*', (req:Request, res:Response) => {
  res.sendFile(path.resolve('./build/client/index.html'))
})

app.listen(port, ()=>{
  console.log(`app is listening on port ${port}`)
})
