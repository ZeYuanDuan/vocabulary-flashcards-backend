const cors = require("cors");
const express = require("express");
const corsOptions = require("./config/corsOptions");

const app = express();

const router = require("./routes");
const errorHandler = require("./middlewares/errorHandler");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const port = process.env.PORT || 3000;

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(router);

app.use(errorHandler);

app.listen(port, "0.0.0.0", () => {
  console.log(`伺服器正在運行運行`);
});
