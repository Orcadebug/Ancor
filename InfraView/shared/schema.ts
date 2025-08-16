import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const deployments = pgTable("deployments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  industry: text("industry").notNull(),
  model: text("model").notNull(),
  provider: text("provider").notNull(),
  status: text("status").notNull().default("pending"),
  chatUrl: text("chat_url"),
  apiUrl: text("api_url"),
  monthlyCost: decimal("monthly_cost", { precision: 10, scale: 2 }),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }),
  configuration: jsonb("configuration"),
  createdAt: timestamp("created_at").defaultNow(),
  deployedAt: timestamp("deployed_at"),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  deploymentId: varchar("deployment_id").references(() => deployments.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull(),
  status: text("status").notNull().default("pending"),
  uploadProgress: integer("upload_progress").default(0),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemMetrics = pgTable("system_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deploymentId: varchar("deployment_id").notNull().references(() => deployments.id),
  gpuUtilization: integer("gpu_utilization"),
  responseTime: decimal("response_time", { precision: 8, scale: 3 }),
  queueLength: integer("queue_length"),
  queriesToday: integer("queries_today"),
  errorRate: decimal("error_rate", { precision: 5, scale: 2 }),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  template: text("template"),
  configuration: jsonb("configuration"),
  active: boolean("active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertDeploymentSchema = createInsertSchema(deployments).omit({
  id: true,
  createdAt: true,
  deployedAt: true,
  chatUrl: true,
  apiUrl: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  processedAt: true,
  uploadProgress: true,
  status: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Deployment = typeof deployments.$inferSelect;
export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type SystemMetrics = typeof systemMetrics.$inferSelect;

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

// Industry and model options
export const INDUSTRIES = [
  { id: "legal", name: "Legal", description: "Contracts, case files, research", icon: "gavel" },
  { id: "healthcare", name: "Healthcare", description: "Patient records, research docs", icon: "heartbeat" },
  { id: "finance", name: "Finance", description: "Reports, compliance docs", icon: "chart-bar" },
  { id: "professional", name: "Professional Services", description: "Proposals, reports", icon: "briefcase" },
] as const;

export const MODELS = [
  { id: "llama-3-8b", name: "LLaMA 3 8B", description: "Lightweight, $300/month", cost: 300 },
  { id: "llama-3-70b", name: "LLaMA 3 70B", description: "Recommended, $1,200/month", cost: 1200 },
  { id: "llama-3-405b", name: "LLaMA 3 405B", description: "Enterprise, $3,000/month", cost: 3000 },
] as const;

export const PROVIDERS = [
  { id: "coreweave", name: "CoreWeave", description: "GPU-optimized cloud" },
  { id: "aws", name: "AWS", description: "Amazon Web Services" },
  { id: "azure", name: "Azure", description: "Microsoft Azure" },
  { id: "gcp", name: "GCP", description: "Google Cloud Platform" },
] as const;
