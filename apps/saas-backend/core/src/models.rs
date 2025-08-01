use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestRun {
    pub id: Uuid,
    pub name: String,
    pub image: String,
    pub command: Vec<String>,  // Note: singular 'command' to match OSS SQL schema
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub duration: Option<i32>,
    pub logs: Option<Vec<String>>,
    pub test_definition_id: Option<Uuid>,  // FK to test_definitions
    pub executor_id: Option<Uuid>,  // FK to test_executors, using UUID not String
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestDefinition {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,  // Optional to match OSS schema
    pub image: String,
    pub commands: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub executor_id: Option<Uuid>,  // FK to test_executors, using UUID not String
    pub labels: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestExecutor {
    pub id: Uuid,  // Using UUID for consistency with OSS schema
    pub name: String,
    pub description: Option<String>,
    pub image: String,
    pub default_command: String,  // Match OSS 'default_command' field name
    pub supported_file_types: Vec<String>,
    pub environment_variables: Vec<String>,  // Match OSS field name
    pub icon: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestSuite {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,  // Optional to match OSS schema
    pub execution_mode: String,
    pub labels: Option<Vec<String>>,
    pub test_definition_ids: Vec<Uuid>,
    pub created_at: DateTime<Utc>,
}