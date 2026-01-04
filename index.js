const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config()
const app = express()
const port = 3000
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.vmnyifr.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const db = client.db('home-service')
    const serviceCollection = db.collection('services')
    const bookingCollection = db.collection('booking')

    app.get('/services', async (req, res) => {
      const result = await serviceCollection.find().toArray()

      res.send(result)
    })
    app.get('/booking', async (req, res) => {
      const result = await bookingCollection.find().toArray()

      res.send(result)
    })


    app.get('/services/:id', async (req, res) => {
      const { id } = req.params
      console.log(id)
      const result = await serviceCollection.findOne({ _id: new ObjectId(id) })

      res.send({
        success: true,
        result
      })
    })


    app.post('/services', async (req, res) => {
      const data = req.body
      console.log(data)
      const result = await serviceCollection.insertOne(data)
      res.send({
        success: true,
        result
      })
    })


    app.post('/booking', async (req, res) => {
      const data = req.body
      console.log(data)
      const result = await bookingCollection.insertOne(data)
      res.send({
        success: true,
        result
      })
    })


    app.put('/services/:id', async (req, res) => {
      const { id } = req.params
      const data = req.body
      console.log(id)
      console.log(data)
      const objectId = new ObjectId(id)
      const filter = { _id: objectId }
      const update = {
        $set: data
      }
      const result = await serviceCollection.updateOne(filter, update)


      res.send({
        success: true,
        result
      })
    })


    app.delete('/services/:id', async (req, res) => {
      const { id } = req.params
      const result = await serviceCollection.deleteOne({ _id: new ObjectId(id) })
      res.send({
        success: true,
        result
      })
    })
    app.delete('/booking/:id', async (req, res) => {
      const { id } = req.params;
      try {
        const result = await bookingCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
          res.json({ success: true, deletedCount: 1 });
        } else {
          res.json({ success: false, deletedCount: 0 });
        }
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
      }
    });


    app.get('/sorted-data', async (req, res) => {
      try {
        const result = await serviceCollection
          .find()
          .sort({ "service_rating.rating": -1 })
          .limit(8)
          .toArray();
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch sorted data" });
      }
    });



    app.put("/service/:id/review", async (req, res) => {
      try {
        const { id } = req.params;
        const newReview = req.body;

        const filter = { _id: new ObjectId(id) };


        const service = await serviceCollection.findOne(filter);
        if (!service) {
          return res.status(404).send({
            success: false,
            message: "Service not found",
          });
        }


        const oldReviews = service.service_rating?.reviews || [];
        const updatedReviews = [...oldReviews, newReview];


        const ratings = updatedReviews.map(r => r.rating || 0);
        const avgRating =
          ratings.length > 0
            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
            : 0;


        const updateDoc = {
          $set: {
            "service_rating.reviews": updatedReviews,
            "service_rating.rating": parseFloat(avgRating),
          },
        };

        const result = await serviceCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount > 0) {
          res.send({
            success: true,
            message: "✅ Review & Rating updated successfully",
            avgRating,
          });
        } else {
          res.status(400).send({
            success: false,
            message: "No changes made",
          });
        }
      } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).send({
          success: false,
          message: "❌ Failed to add review",
          error: error.message,
        });
      }
    });

    app.put("/booking/:id/review", async (req, res) => {
      try {
        const { id } = req.params;
        const newReview = req.body;


        const filter = { id: id };


        const service = await bookingCollection.findOne(filter);
        if (!service) {
          return res.status(404).send({
            success: false,
            message: "Service not found",
          });
        }


        const oldReviews = service.rating?.reviews || [];
        const updatedReviews = [...oldReviews, newReview];


        const ratings = updatedReviews.map(r => r.rating || 0);
        const avgRating =
          ratings.length > 0
            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
            : 0;


        const updateDoc = {
          $set: {
            "rating.reviews": updatedReviews,
            "rating.rating": parseFloat(avgRating),
          },
        };

        const result = await bookingCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount > 0) {
          res.send({
            success: true,
            message: "✅ Review & Rating updated successfully",
            avgRating,
          });
        } else {
          res.status(400).send({
            success: false,
            message: "No changes made",
          });
        }
      } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).send({
          success: false,
          message: "❌ Failed to add review",
          error: error.message,
        });
      }
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Server is Running on port 3000')
})

app.get('/home', (req, res) => {
  res.send("Yes its worked properly fine")
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


