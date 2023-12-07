const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000 || process.env.PORT;
const mongoose = require("mongoose");
const MONGO_URI = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false";
const User = require('./models/user');
const bodyParser = require('body-parser');

// setting view engine to ejs
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// index page
app.get("/", async (req, res) => {
  //await addUser(); // Create new user on page render
  res.render("index");
});


// page
app.get("/data-display", async (req, res) => {
  const users = await User.find({})
  res.render("data_display", {users})
});

// add new user to database
app.post("/addUser", async (req, res) => {
  const user = new User(req.body);

  const createdUser = await user.save();

  res.status(200).json(createdUser);
});

// update existing user in database
app.post("/updateUser", async (req, res) => {

  const user = await user.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  }).exec()

  res.status(200).json(user);
});

app.delete("/deleteUser", async (req, res) => {
  // delete user given id
  // error handling for invalid indexes
});

// Connecting to MongoDB
mongoose.connection.on("connecting", () => {
  console.log(`Connecting to Mongo at ${MONGO_URI}`);
});

mongoose.connection.on("connected", () => {
  console.log("Mongo connection established");
});

mongoose.connection.on("error", (error) => {
  console.log("Mongo connection error", error);
});

try {
  mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
} catch (error) {
  console.log(`Mongo connection error: ${error}`);
}

// default user params
// used in app.get("/")
async function addUser() {
    const user = new User(
        {
            username: 'JohnDoe',
            firstname: 'John',
            lastname: 'Doe',
        }
    )

    const createdUser = await user.save();
}

// listening to application at http://localhost:3000/
app.listen(PORT, () => {
  console.log(`Server listening at port: ${PORT}`);
});
