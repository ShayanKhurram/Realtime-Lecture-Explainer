// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({


  conversations: defineTable({
    timestamp: v.string(), // ISO timestamp of when recording stopped
    blocks: v.string(),    // JSON stringified blocks (transcriptions + AI responses)
    summary: v.string(),   // Short summary for display in list views
    userId: v.optional(v.string()), // Optional user ID if you implement auth
  }),
    notes: defineTable({
    topic: v.string(),
    keyConcepts: v.array(v.string()),
    bulletNotes: v.array(v.string()),
    definitions: v.string(), // JSON stringified array of {term, def} objects
    questions: v.array(v.string()),
    summary: v.string(),
    rawTranscription: v.string(),
    timestamp: v.string(),
    userId: v.optional(v.string()), // Optional user ID if you implement auth
  })
  
});

