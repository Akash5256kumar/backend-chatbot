import OpenAI from "openai";
import mongoose from "mongoose";
import dotenv from "dotenv";
import DataModel from "./models/Data.js";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mongo connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"));

// Data
const data = [
  "Parking ₹100 per hour available or its depending on the Maull",
  "24/7 customer support available",
  "You can book parking via app"
];

async function seedData() {
  for (let item of data) {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: item,
    });

    const embedding = embeddingResponse.data[0].embedding;

    await DataModel.create({
      text: item,
      embedding: embedding,
    });

    console.log("Inserted:", item);
  }

  process.exit();
}

seedData();
