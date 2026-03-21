import express from "express";
import OpenAI from "openai";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import DataModel from "./models/Data.js";

//ci/cd pipelines should set env vars, but for local development we can use a .env file

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ message: "message is required" });
    }

    const queryEmbeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: userMessage,
    });

    const queryEmbedding = queryEmbeddingRes.data[0].embedding;

    const allData = await DataModel.find({
      answer: { $exists: true, $ne: "" },
      embedding: { $exists: true, $ne: [] },
    }).lean();

    if (allData.length === 0) {
      return res.status(404).json({ message: "No embedded data found. Run seed.js first." });
    }

    const rankedMatches = allData
      .map((item) => ({
        ...item,
        similarity: cosineSimilarity(queryEmbedding, item.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    const bestMatch = rankedMatches[0];

    if (!bestMatch) {
      return res.status(404).json({ message: "No matching FAQ found." });
    }

    const context = formatRetrievedFaqs(rankedMatches.slice(0, 3));
    let finalMessage = bestMatch.answer;

    try {
      const generatedResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: [
              "You are a helpful parking assistant.",
              "Answer only using the retrieved FAQ context.",
              "Rephrase naturally so the response feels conversational, not copied.",
              "Reply in the same language as the user's message.",
              "Keep the answer concise and practical.",
              "If the retrieved context indicates human handoff is needed, politely suggest contacting support.",
              "Do not invent details that are not present in the context.",
            ].join(" "),
          },
          {
            role: "system",
            content: `Retrieved FAQ context:\n${context}`,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
      });

      finalMessage =
        generatedResponse.choices[0]?.message?.content?.trim() || bestMatch.answer;
    } catch (generationError) {
      console.error("Response generation fallback used:", generationError);
    }

    return res.json({
      message: finalMessage,
    });
  } catch (error) {
    console.error("Chat request failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

function formatRetrievedFaqs(matches) {
  return matches
    .map(
      (item, index) =>
        [
          `FAQ ${index + 1}`,
          `Query: ${item.query}`,
          `Intent: ${item.intent}`,
          `Answer: ${item.answer}`,
          `Needs human handoff: ${item.needs_human_handoff ? "yes" : "no"}`,
          `Tags: ${item.retrieval_tags.join(", ")}`,
        ].join("\n")
    )
    .join("\n\n");
}
