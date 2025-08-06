use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

// SaaS-specific models that extend the core types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaasTestDefinition {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub code: String,
    pub language: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    // SaaS-specific fields
    pub user_id: Option<Uuid>,
    pub organization_id: Option<Uuid>,
    pub is_public: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaasTestRun {
    pub id: Uuid,
    pub definition_id: Uuid,
    pub status: String,
    pub result: Option<serde_json::Value>,
    pub error: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    // SaaS-specific fields
    pub user_id: Option<Uuid>,
    pub organization_id: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaasExecutor {
    pub id: Uuid,
    pub name: String,
    pub executor_type: String,
    pub config: serde_json::Value,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    // SaaS-specific fields
    pub user_id: Option<Uuid>,
    pub organization_id: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaasTestSuite {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub test_definitions: Vec<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    // SaaS-specific fields
    pub user_id: Option<Uuid>,
    pub organization_id: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Organization {
    pub id: Uuid,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub organization_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Simplified database operations (placeholder implementation)
pub struct Database {
    // For now, use in-memory storage
    test_definitions: std::sync::Arc<std::sync::Mutex<Vec<SaasTestDefinition>>>,
    test_runs: std::sync::Arc<std::sync::Mutex<Vec<SaasTestRun>>>,
}

impl Database {
    pub async fn new(_database_url: &str) -> Result<Self, anyhow::Error> {
        // Placeholder implementation - in production this would connect to PostgreSQL
        Ok(Self {
            test_definitions: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
            test_runs: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
        })
    }

    // Test Definition CRUD
    pub async fn create_test_definition(&self, definition: &SaasTestDefinition) -> Result<(), anyhow::Error> {
        let mut defs = self.test_definitions.lock().unwrap();
        defs.push(definition.clone());
        Ok(())
    }

    pub async fn get_test_definition(&self, id: Uuid) -> Result<Option<SaasTestDefinition>, anyhow::Error> {
        let defs = self.test_definitions.lock().unwrap();
        Ok(defs.iter().find(|d| d.id == id).cloned())
    }

    pub async fn list_test_definitions(&self, _user_id: Option<Uuid>, _organization_id: Option<Uuid>) -> Result<Vec<SaasTestDefinition>, anyhow::Error> {
        let defs = self.test_definitions.lock().unwrap();
        Ok(defs.clone())
    }

    pub async fn delete_test_definition(&self, id: Uuid) -> Result<(), anyhow::Error> {
        let mut defs = self.test_definitions.lock().unwrap();
        defs.retain(|d| d.id != id);
        Ok(())
    }

    // Test Run CRUD
    pub async fn create_test_run(&self, run: &SaasTestRun) -> Result<(), anyhow::Error> {
        let mut runs = self.test_runs.lock().unwrap();
        runs.push(run.clone());
        Ok(())
    }

    pub async fn list_test_runs(&self, _user_id: Option<Uuid>, _organization_id: Option<Uuid>) -> Result<Vec<SaasTestRun>, anyhow::Error> {
        let runs = self.test_runs.lock().unwrap();
        Ok(runs.clone())
    }

    pub async fn get_test_run(&self, id: Uuid) -> Result<Option<SaasTestRun>, anyhow::Error> {
        let runs = self.test_runs.lock().unwrap();
        Ok(runs.iter().find(|r| r.id == id).cloned())
    }
}