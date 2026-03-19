# Backend Chatbot

A Node.js + Express backend for an AI-powered parking support chatbot. The service uses OpenAI embeddings to match a user's message with stored parking FAQ data in MongoDB, then uses an OpenAI chat model to turn the matched answer into a more natural conversational reply.

This project is designed for a parking assistant use case, where users can ask questions such as booking availability, nearby parking, pricing, directions, timings, and support-related issues.

## Overview

The backend does three main jobs:

1. Accepts a user message through a REST API.
2. Finds the most relevant FAQ entries by comparing vector embeddings.
3. Generates a concise response based only on the retrieved FAQ context.

The current server exposes a single API endpoint:

- `POST /chat`

## Features

- Express-based REST API
- OpenAI embedding-based retrieval
- OpenAI chat completion for natural responses
- MongoDB storage for FAQ content and embeddings
- CORS enabled for frontend integration
- Environment-variable based configuration using `dotenv`
- Parking-focused FAQ dataset included in [`data/parkingFaqs.js`](/Users/mac/Desktop/AI CHATBOT/chatbot_backend/data/parkingFaqs.js)

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- OpenAI API
- `dotenv`
- `cors`
- `body-parser`

## Project Structure

```text
chatbot_backend/
├── data/
│   └── parkingFaqs.js
├── models/
│   └── Data.js
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
├── seed.js
└── server.js
```

## How It Works

### 1. User sends a message

The frontend or API client sends a request to `POST /chat` with a JSON body like:

```json
{
  "message": "Can I pre-book parking for tomorrow?"
}
```

### 2. Backend creates an embedding

The server converts the user message into an embedding using OpenAI model `text-embedding-3-small`.

### 3. Backend loads stored FAQ embeddings

The app fetches FAQ records from MongoDB where:

- `answer` exists
- `embedding` exists
- embedding array is not empty

### 4. Similarity scoring

Each stored embedding is compared with the user's embedding using cosine similarity.

### 5. Best FAQs are selected

The server sorts the FAQ records by similarity and prepares the top 3 items as retrieval context.

### 6. Final response generation

The backend sends that context to `gpt-4o-mini`, with instructions to:

- answer only from the retrieved context
- keep the answer concise and practical
- respond in the same language as the user
- avoid making up details
- suggest support contact when human handoff is needed

If response generation fails, the server falls back to the best matched FAQ answer directly.

## Environment Variables

Create a `.env` file in the project root and add the following variables:

```env
OPENAI_API_KEY=your_openai_api_key_here
MONGO_URI=your_mongodb_connection_string_here
```

A safe template is already available in [`/.env.example`](/Users/mac/Desktop/AI CHATBOT/chatbot_backend/.env.example).

## Prerequisites

Before running the project, make sure you have:

- Node.js 18 or later
- npm
- A MongoDB database
- A valid OpenAI API key

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

Then create your environment file:

```bash
cp .env.example .env
```

After that, update `.env` with your real credentials.

## Running the Project

### 1. Seed the database

Run:

```bash
node seed.js
```

### 2. Start the server

Run:

```bash
node server.js
```

The API starts on:

```text
http://localhost:3000
```

## API Documentation

### `POST /chat`

Returns a chatbot reply for the user's message.

#### Request body

```json
{
  "message": "How do I book a parking slot?"
}
```

#### Success response

```json
{
  "message": "Open Home, choose a parking location, select your slot and timing, add or select your vehicle, and proceed to payment."
}
```

#### Validation error

```json
{
  "message": "message is required"
}
```

#### No embedded data

```json
{
  "message": "No embedded data found. Run seed.js first."
}
```

#### Internal server error

```json
{
  "message": "Internal server error"
}
```

## Example cURL Request

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can I book parking for a specific time?"
  }'
```

## MongoDB Data Model

The chatbot uses the `Data` collection defined in [`models/Data.js`](/Users/mac/Desktop/AI CHATBOT/chatbot_backend/models/Data.js).

### Fields

- `text`: raw text content
- `query`: user-style FAQ query
- `intent`: intent identifier
- `answer`: final answer to return or rephrase
- `retrieval_tags`: tags for grouping or retrieval hints
- `needs_human_handoff`: whether support escalation may be needed
- `embedding`: vector representation used for similarity search

## FAQ Dataset

The parking knowledge base is stored in [`data/parkingFaqs.js`](/Users/mac/Desktop/AI CHATBOT/chatbot_backend/data/parkingFaqs.js). It contains a large set of parking-related questions and answers, including topics such as:

- booking parking slots
- nearby parking discovery
- live availability
- pricing
- parking timings
- map and GPS issues
- directions
- support and escalation cases

## Important Note About Seeding

The current [`seed.js`](/Users/mac/Desktop/AI CHATBOT/chatbot_backend/seed.js) inserts a small sample dataset with `text` and `embedding` fields only.

However, the main chat flow in [`server.js`](/Users/mac/Desktop/AI CHATBOT/chatbot_backend/server.js) expects records with fields such as:

- `query`
- `answer`
- `intent`
- `retrieval_tags`
- `needs_human_handoff`
- `embedding`

That means if you want full FAQ-based retrieval from `data/parkingFaqs.js`, you should update `seed.js` to import that dataset and store complete FAQ records with embeddings for each entry.

## Current Limitations

- No authentication or rate limiting
- No health check endpoint
- Port is currently hardcoded to `3000`
- No automated tests yet
- Retrieval currently loads matching records from MongoDB and ranks them in application memory
- The included seed script does not yet seed the full FAQ dataset structure used by the chat endpoint

## Suggested Next Improvements

- Add `npm` scripts such as `start`, `dev`, and `seed`
- Update `seed.js` to use `data/parkingFaqs.js`
- Add a health endpoint like `GET /health`
- Add request validation
- Add logging and error monitoring
- Make the server port configurable with `PORT`
- Add tests for chat, seeding, and similarity ranking

## Troubleshooting

### MongoDB connection failed

Check that:

- `MONGO_URI` is valid
- your database is running
- your IP is allowed if you use MongoDB Atlas

### OpenAI request failed

Check that:

- `OPENAI_API_KEY` is correct
- your OpenAI account has access and billing configured
- your network connection is working

### `No embedded data found. Run seed.js first.`

This means your MongoDB collection does not contain the embedded FAQ data required by the server.

Run:

```bash
node seed.js
```

If you want richer responses from the parking FAQ dataset, extend the seed script to store the records from `data/parkingFaqs.js`.

## Security Notes

- Never commit your real `.env` file
- Keep `OPENAI_API_KEY` and `MONGO_URI` private
- Rotate keys immediately if they are exposed

## License

This project is currently marked as `ISC` in [`package.json`](/Users/mac/Desktop/AI CHATBOT/chatbot_backend/package.json).
