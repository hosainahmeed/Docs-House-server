const express = require("express");
const jwt = require("jsonwebtoken");
const coockieParser = require("cookie-parser");
const app = express();
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["https://docshouse-8de58.web.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(coockieParser());

// MongoDB connection URI
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DOCS_USER}:${process.env.DOCS_PASS}@docscluster.i1xxh.mongodb.net/?retryWrites=true&w=majority&appName=docsCluster`;

// Create a new MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).send({ message: "No token provided" });
    }

    jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
      if (err) {
        return res.status(403).send({ message: "Invalid token" });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    res.status(500).send({ message: "Token verification failed", error });
  }
};
// Function to run the server and connect to MongoDB
async function run() {
  try {
    // await client.connect();
    const doctorsCollection = client.db("DocsHouse").collection("doctor");
    const reviewsCollection = client.db("DocsHouse").collection("reviews");
    const appointmentCollection = client
      .db("DocsHouse")
      .collection("appoinntment");
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      res

        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ succsess: true });
    });

    // Define routes
    app.get("/doctorsProfile", async (req, res) => {
      const result = await doctorsCollection.find().toArray();
      res.send(result);
    });

    //appointment

    app.get("/appointment", async (req, res) => {
      const result = await appointmentCollection.find().toArray();
      res.send(result);
    });
    app.post("/appointment/:id", async (req, res) => {
      const id = req.params.id;
      const { name, services, date } = req.body;

      const query = { _id: new ObjectId(id) };

      const appointmentDetails = {
        ...query,
        name,
        services,
        date,
      };

      try {
        const result = await appointmentCollection.insertOne(
          appointmentDetails
        ); // Insert full appointment details
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to create appointment", error });
      }
    });
    
    app.post("/appointment", async (req, res) => {
      const data = req.body;
      try {
        const result = await appointmentCollection.insertOne(data);
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to create appointment", error });
      }
    });
    
    app.delete("/appointment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await appointmentCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  } finally {
    // await client.close();
  }
}

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

app.get("/", (req, res) => {
  res.send("home page");
});

run().catch(console.dir);
