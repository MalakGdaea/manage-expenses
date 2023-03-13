const express = require('express')
const app = express()
const routes = require("./server/routes/api");
app.use(express.json());
app.use("/", routes);




const port = 3012;
app.listen(port, function () {
  console.log(`Running server on port ${port}`);
});
