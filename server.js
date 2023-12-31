require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000 || process.env.PORT;
const { MongoClient, ServerApiVersion } = require("mongodb");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

// setting view engine to ejs
app.set("view engine", "ejs");
app.use(express.static('public'));

// body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const pass = process.env.MONGO_DB_PASSWORD;
const user = process.env.MONGO_DB_USERNAME;
const data = process.env.MONGO_DB_NAME;
const collection = process.env.MONGO_COLLECTION;

const databaseAndCollection = { db: "${data}", collection: "${collection}" };

const uri = `mongodb+srv://${user}:${pass}@cluster0.lzud9qf.mongodb.net/?retryWrites=true&w=majority`;

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
    try {
        // Fetch Driver Standings
        const driverResponse = await fetch(
            "http://ergast.com/api/f1/current/driverStandings.json"
        );
        const driverData = await driverResponse.json();
        const driverStandings =
            driverData.MRData.StandingsTable.StandingsLists[0].DriverStandings.map(
                (item) => ({
                    ranking: item.position,
                    name: `${item.Driver.givenName} ${item.Driver.familyName}`,
                    team: item.Constructors[0].name,
                    points: item.points,
                })
            );

        // Fetch Constructor Standings
        const constructorResponse = await fetch(
            "http://ergast.com/api/f1/current/constructorStandings.json"
        );
        const constructorData = await constructorResponse.json();
        const constructorStandings =
            constructorData.MRData.StandingsTable.StandingsLists[0].ConstructorStandings.map(
                (item) => ({
                    ranking: item.position,
                    name: item.Constructor.name,
                    points: item.points,
                })
            );

        // Render the page with both standings
        res.render("index", {
            driverStandings: driverStandings,
            constructorStandings: constructorStandings,
        });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).render("error", { error: error }); // Render an error view or handle differently
    }
});

// handle user details
app.get("/addUser", (req, res) => {
    res.render("user.ejs");
});

app.get("/stats", async (req, res) => {
    
    
    try {
        // Connect to MongoDB Atlas
        await client.connect();
        const result = await client
            .db(data) // Use the 'data' variable without curly braces
            .collection(collection)
            .aggregate([
                {
                    $group: {
                        _id: "$team",
                        count: { $sum: 1}
                    }
                }
            ]).toArray();

        console.log(result)

        const labels = result.map(item => item._id);
        const values = result.map(item => item.count);

        
        const chart  = `<div>
        <canvas id="myChart"></canvas>
    </div>
    
    <script>
        
            const ctx = document.getElementById('myChart');
    
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ${JSON.stringify(labels)},
                    datasets: [{
                        label: '# of Votes',
                        data: ${JSON.stringify(values)},
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        
    </script>
    `;

        res.render("stats.ejs", { chart });
        
    } catch (error) {
        console.error("Error processing application:", error);
        res.status(500).send("Internal Server Error");
    } finally {
        // Close the MongoDB connection
        await client.close();
    }

});

app.post("/createUser", async (req, res) => {
    const { nameP, email, team } = req.body;

    try {
        // Connect to MongoDB Atlas
        await client.connect();
        const result = await client
            .db(data) // Use the 'data' variable without curly braces
            .collection(collection)
            .insertOne({ nameP, email, team });

        res.render("review.ejs", { nameP, email, team });
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
            .findOne({ email });

        const nameP = result.nameP;
        const team = result.team;

        res.render("team.ejs", { nameP, email, team });
    } catch (error) {
        const nameP = "NONE";
        const email = "NONE";
        const team = "NONE";
        res.render("team.ejs", { nameP, email, team });
    } finally {
        // Close the MongoDB connection
        await client.close();
    }
});

// page
app.get("/myTeam", async (req, res) => {
    res.render("form.ejs");
});

// listening to application at http://localhost:3000/
app.listen(PORT, () => {
    console.log(`Server listening at port: ${PORT}`);
});
