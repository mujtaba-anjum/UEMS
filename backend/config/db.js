

/*
const { MongoClient, ServerApiVersion } = require('mongodb');
//const uri = "mongodb+srv://ems:ems*12@ems-db.9jsl5mj.mongodb.net/?appName=EMS-DB";

 const uri = "mongodb+srv://Hamza:Hamza87@myapp.cdbvrtp.mongodb.net/?retryWrites=true&w=majority";


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectDB() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
connectDB().catch(console.dir);
module.exports = connectDB;

*/
//---------------------------------------




// utils/db.js

const { MongoClient, ServerApiVersion } = require('mongodb');

// Replace the following with your actual MongoDB connection URI
 const uri = "mongodb+srv://Hamza:Hamza87@myapp.cdbvrtp.mongodb.net/?retryWrites=true&w=majority";



const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


let _db;

async function connectToMongo() {
  try {
    await client.connect();
    _db = client.db( "myDatabase"); // <----
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}

function getDb() {
  if (!_db) {
    throw new Error("❌ Database not connected. Call connectToMongo() first.");
  }
  return _db;
}

module.exports = { connectToMongo, getDb};


