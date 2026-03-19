import mongoose from "mongoose";

const DataSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  query: {
    type: String,
    index: true,
    trim: true,
  },
  intent: {
    type: String,
    index: true,
    trim: true,
  },
  answer: {
    type: String,
    trim: true,
  },
  retrieval_tags: {
    type: [String],
    default: [],
  },
  needs_human_handoff: {
    type: Boolean,
    default: false,
  },
  embedding: {
    type: [Number],
    required: true,
  },
});

const DataModel = mongoose.models.Data || mongoose.model("Data", DataSchema);

export default DataModel;
