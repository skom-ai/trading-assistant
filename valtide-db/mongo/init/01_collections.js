/**
 * File: mongo/init/01_collections.js
 * Description: Valtide source module.
 * Source: specs/arch
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 */
// =====================================================================
// File: 01_collections.js
// Description: MongoDB first-boot initializer for the audit-only trace
//              store. Creates the three trace collections with schema
//              validators, correlation/created indexes, and a TTL index
//              enforcing the retention window.
// Source: specs/arch/data/mongodb-collections.md (STOCK-606)
// Notes: Audit-only — never client-exposed. Contains no PII (FR5.3).
//        Run via docker-entrypoint-initdb.d in the mongo image.
// =====================================================================

const dbName = "valtide_traces";
const db = db.getSiblingDB(dbName);

// Retention window in seconds for raw LLM traces (default 90 days).
const RETENTION_SECONDS = 60 * 60 * 24 * 90;

// ---------------------------------------------------------------------
// llm_trace — one document per LLM call: prompt, response, model params.
// ---------------------------------------------------------------------
db.createCollection("llm_trace", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["correlation_id", "feature", "model", "prompt_version", "created_at"],
      properties: {
        correlation_id: { bsonType: "string" },
        feature: { enum: ["FR1_NEWS", "FR3_STRATEGY"] },
        model: { bsonType: "string" },
        prompt_version: { bsonType: "string" },
        temperature: { bsonType: ["double", "int"] },
        input_hash: { bsonType: "string" },
        prompt: { bsonType: "string" },
        raw_response: { bsonType: "string" },
        parsed_ok: { bsonType: "bool" },
        retry_count: { bsonType: "int" },
        created_at: { bsonType: "date" }
      }
    }
  }
});
db.llm_trace.createIndex({ correlation_id: 1 });
db.llm_trace.createIndex({ created_at: 1 }, { expireAfterSeconds: RETENTION_SECONDS });

// ---------------------------------------------------------------------
// prompt_version — registry of prompt templates by version.
// ---------------------------------------------------------------------
db.createCollection("prompt_version", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["version", "feature", "template", "created_at"],
      properties: {
        version: { bsonType: "string" },
        feature: { enum: ["FR1_NEWS", "FR3_STRATEGY"] },
        template: { bsonType: "string" },
        created_at: { bsonType: "date" }
      }
    }
  }
});
db.prompt_version.createIndex({ version: 1, feature: 1 }, { unique: true });

// ---------------------------------------------------------------------
// agent_run — structured LangGraph execution trace per correlation_id.
// ---------------------------------------------------------------------
db.createCollection("agent_run");
db.agent_run.createIndex({ correlation_id: 1 });
db.agent_run.createIndex({ created_at: 1 }, { expireAfterSeconds: RETENTION_SECONDS });

print("[valtide-db-init] MongoDB trace collections + indexes created in " + dbName);
