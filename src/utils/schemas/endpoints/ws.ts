import z from "zod";

export const ChatClientMessageSchema = {
  type: z.literal("direct"),
  userId: z.string().min(1),
  content: z.string().min(1).max(1000).min(10),
  toUserId: z.string().min(1),
}

export const ChatServerMessageSchema = z.object({
  type: z.literal("direct"),
  fromUserId: z.string().min(1),
  content: z.string().min(1).max(1000).min(10),
  timestamp: z.string().min(1),
});

export type ChatClientMessage = z.infer<typeof ChatClientMessageSchema>;