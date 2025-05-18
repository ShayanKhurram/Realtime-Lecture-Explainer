import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { query } from "./_generated/server";

export const create = mutation({
  args: {
    timestamp: v.string(),
    blocks: v.string(),
    summary: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const conversationId = await ctx.db.insert("conversations", {
      timestamp: args.timestamp,
      blocks: args.blocks,
      summary: args.summary,
      userId: args.userId,
    });
    
    return conversationId;
  },
});

// List all conversations for a specific user
export const listUserConversations = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const { userId } = args;
    
    // Query only conversations for this user
    const conversations = await ctx.db
      .query('conversations')
      .filter((q) => q.eq(q.field('userId'), userId))
      .order('desc')
      .collect();
    
    // Return only the necessary information for the list
    return conversations.map(conv => ({
      _id: conv._id,
      timestamp: conv.timestamp,
      summary: conv.summary
    }));
  },
});

// Get a single conversation by ID
export const getConversationById = query({
  args: { id: v.id('conversations') },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.id);
    return conversation;
  },
});


// Create a new note
export const createNote = mutation({
  args: {
    topic: v.string(),
    keyConcepts: v.array(v.string()),
    bulletNotes: v.array(v.string()),
    definitions: v.string(), // JSON stringified
    questions: v.array(v.string()),
    summary: v.string(),
    rawTranscription: v.string(),
    timestamp: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const noteId = await ctx.db.insert('notes', {
      userId: args.userId,
      topic: args.topic,
      keyConcepts: args.keyConcepts,
      bulletNotes: args.bulletNotes,
      definitions: args.definitions,
      questions: args.questions,
      summary: args.summary,
      rawTranscription: args.rawTranscription,
      timestamp: args.timestamp
    });
    
    return noteId;
  },
});

// List all notes for a user
export const listUserNotes = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query('notes')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .order('desc')
      .collect();
    
    return notes;
  },
});

// Get a single note by ID
export const getNoteById = query({
  args: {
    id: v.id('notes'),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id);
    return note;
  },
});

// Delete a note
export const deleteNote = mutation({
  args: {
    id: v.id('notes'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Update a note
export const updateNote = mutation({
  args: {
    id: v.id('notes'),
    topic: v.optional(v.string()),
    keyConcepts: v.optional(v.array(v.string())),
    bulletNotes: v.optional(v.array(v.string())),
    definitions: v.optional(v.string()),
    questions: v.optional(v.array(v.string())),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Filter out undefined values
    const validUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    await ctx.db.patch(id, validUpdates);
  },
});

