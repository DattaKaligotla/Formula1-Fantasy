require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000 || process.env.PORT;
const { MongoClient, ServerApiVersion } = require("mongodb");
const bodyParser = require('body-parser');

// setting view engine to ejs
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const pass = process.env.MONGO_DB_PASSWORD;
const user = process.env.MONGO_DB_USERNAME;
const data = process.env.MONGO_DB_NAME;
const collection = process.env.MONGO_COLLECTION;

const databaseAndCollection = { db: "${data}", collection: "${collection}" };

const uri = `mongodb+srv://${user}:${pass}@cluster0.lzud9qf.mongodb.net/?retryWrites=true&w=majority`;

//console.log(uri);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
run().catch(console.dir);


// index page
app.get("/", async (req, res) => {
  //await addUser(); // Create new user on page render
  res.render("index");
});


app.get("/addUser", (req, res) => {
  res.render("user.ejs");
});

app.post("/createUser", async (req, res) => {
  const { nameP, email, team} = req.body;

  try {
      // Connect to MongoDB Atlas
      await client.connect();
      const result = await client
          .db(data) // Use the 'data' variable without curly braces
          .collection(collection) 
          .insertOne({ nameP, email, team});

      //res.render("review.ejs", { nameP, email, team});
  } catch (error) {
      console.error("Error processing application:", error);
      res.status(500).send("Internal Server Error");
  } finally {
      // Close the MongoDB connection
      await client.close();
  }
});


app.post("/getTeam", async (req, res) => {
  try {
      // Connect to MongoDB Atlas
      const { email } = req.body;

      await client.connect();
      //if not found
      const result = await client
          .db(data)
          .collection(collection)
          .findOne({email});

      const nameP = result.nameP
      const team = result.team
      
      res.render("team.ejs", { nameP, email, team});
  } catch (error) {
      const nameP = "NONE"
      const email = "NONE"
      const team = "NONE"
      res.render("team.ejs", { nameP, email, team});
  } finally {
      // Close the MongoDB connection
      await client.close();
  }
});

// page
app.get("/myTeam", async (req, res) => {
  res.render("my_team.ejs")
});

// listening to application at http://localhost:3000/
app.listen(PORT, () => {
  console.log(`Server listening at port: ${PORT}`);
});
