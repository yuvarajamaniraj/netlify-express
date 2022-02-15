const express = require("express");
const serverless = require("serverless-http");

const app = express();
const cors = require('cors');
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    Responses: "Api connection works properly!"
  });
});

app.use(cors());
app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);
