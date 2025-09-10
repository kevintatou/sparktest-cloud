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
    pub slug: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrganizationMember {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub user_id: Uuid,
    pub role: String, // admin, developer, viewer
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrganizationPolicy {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub max_concurrent_runs: i32,
    pub daily_cap: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Simplified database operations (placeholder implementation)
pub struct Database {
    // For now, use in-memory storage
    test_definitions: std::sync::Arc<std::sync::Mutex<Vec<SaasTestDefinition>>>,
    test_runs: std::sync::Arc<std::sync::Mutex<Vec<SaasTestRun>>>,
    executors: std::sync::Arc<std::sync::Mutex<Vec<SaasExecutor>>>,
    test_suites: std::sync::Arc<std::sync::Mutex<Vec<SaasTestSuite>>>,
    organizations: std::sync::Arc<std::sync::Mutex<Vec<Organization>>>,
    organization_members: std::sync::Arc<std::sync::Mutex<Vec<OrganizationMember>>>,
    users: std::sync::Arc<std::sync::Mutex<Vec<User>>>,
    organization_policies: std::sync::Arc<std::sync::Mutex<Vec<OrganizationPolicy>>>,
}

impl Database {
    pub async fn new(_database_url: &str) -> Result<Self, anyhow::Error> {
        // Placeholder implementation - in production this would connect to PostgreSQL
        Ok(Self {
            test_definitions: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
            test_runs: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
            executors: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
            test_suites: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
            organizations: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
            organization_members: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
            users: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
            organization_policies: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
        })
    }

    // Organization CRUD
    pub async fn create_organization(&self, org: &Organization) -> Result<(), anyhow::Error> {
        let mut orgs = self.organizations.lock().unwrap();
        orgs.push(org.clone());
        Ok(())
    }

    pub async fn get_organization(&self, id: Uuid) -> Result<Option<Organization>, anyhow::Error> {
        let orgs = self.organizations.lock().unwrap();
        Ok(orgs.iter().find(|o| o.id == id).cloned())
    }

    pub async fn get_organization_by_slug(&self, slug: &str) -> Result<Option<Organization>, anyhow::Error> {
        let orgs = self.organizations.lock().unwrap();
        Ok(orgs.iter().find(|o| o.slug == slug).cloned())
    }

    pub async fn list_organizations(&self) -> Result<Vec<Organization>, anyhow::Error> {
        let orgs = self.organizations.lock().unwrap();
        Ok(orgs.clone())
    }

    // User CRUD
    pub async fn create_user(&self, user: &User) -> Result<(), anyhow::Error> {
        let mut users = self.users.lock().unwrap();
        users.push(user.clone());
        Ok(())
    }

    pub async fn get_user(&self, id: Uuid) -> Result<Option<User>, anyhow::Error> {
        let users = self.users.lock().unwrap();
        Ok(users.iter().find(|u| u.id == id).cloned())
    }

    // Organization Membership CRUD
    pub async fn create_organization_member(&self, member: &OrganizationMember) -> Result<(), anyhow::Error> {
        let mut members = self.organization_members.lock().unwrap();
        members.push(member.clone());
        Ok(())
    }

    pub async fn get_user_memberships(&self, user_id: Uuid) -> Result<Vec<OrganizationMember>, anyhow::Error> {
        let members = self.organization_members.lock().unwrap();
        Ok(members.iter().filter(|m| m.user_id == user_id).cloned().collect())
    }

    pub async fn get_organization_members(&self, org_id: Uuid) -> Result<Vec<OrganizationMember>, anyhow::Error> {
        let members = self.organization_members.lock().unwrap();
        Ok(members.iter().filter(|m| m.organization_id == org_id).cloned().collect())
    }

    // Organization Policy CRUD
    pub async fn create_organization_policy(&self, policy: &OrganizationPolicy) -> Result<(), anyhow::Error> {
        let mut policies = self.organization_policies.lock().unwrap();
        policies.push(policy.clone());
        Ok(())
    }

    pub async fn get_organization_policy(&self, org_id: Uuid) -> Result<Option<OrganizationPolicy>, anyhow::Error> {
        let policies = self.organization_policies.lock().unwrap();
        Ok(policies.iter().find(|p| p.organization_id == org_id).cloned())
    }

    // Test Definition CRUD
    pub async fn create_test_definition(&self, definition: &SaasTestDefinition) -> Result<(), anyhow::Error> {
        let mut defs = self.test_definitions.lock().unwrap();
        defs.push(definition.clone());
        Ok(())
    }

    pub async fn get_test_definition(&self, id: Uuid, org_id: Uuid) -> Result<Option<SaasTestDefinition>, anyhow::Error> {
        let defs = self.test_definitions.lock().unwrap();
        Ok(defs.iter().find(|d| d.id == id && d.organization_id == Some(org_id)).cloned())
    }

    pub async fn list_test_definitions(&self, org_id: Uuid) -> Result<Vec<SaasTestDefinition>, anyhow::Error> {
        let defs = self.test_definitions.lock().unwrap();
        Ok(defs.iter().filter(|d| d.organization_id == Some(org_id)).cloned().collect())
    }

    pub async fn delete_test_definition(&self, id: Uuid, org_id: Uuid) -> Result<(), anyhow::Error> {
        let mut defs = self.test_definitions.lock().unwrap();
        defs.retain(|d| !(d.id == id && d.organization_id == Some(org_id)));
        Ok(())
    }

    // Test Run CRUD
    pub async fn create_test_run(&self, run: &SaasTestRun) -> Result<(), anyhow::Error> {
        let mut runs = self.test_runs.lock().unwrap();
        runs.push(run.clone());
        Ok(())
    }

    pub async fn list_test_runs(&self, org_id: Uuid) -> Result<Vec<SaasTestRun>, anyhow::Error> {
        let runs = self.test_runs.lock().unwrap();
        Ok(runs.iter().filter(|r| r.organization_id == Some(org_id)).cloned().collect())
    }

    pub async fn get_test_run(&self, id: Uuid, org_id: Uuid) -> Result<Option<SaasTestRun>, anyhow::Error> {
        let runs = self.test_runs.lock().unwrap();
        Ok(runs.iter().find(|r| r.id == id && r.organization_id == Some(org_id)).cloned())
    }

    // Executor CRUD  
    pub async fn create_executor(&self, executor: &SaasExecutor) -> Result<(), anyhow::Error> {
        let mut execs = self.executors.lock().unwrap();
        execs.push(executor.clone());
        Ok(())
    }

    pub async fn list_executors(&self, org_id: Uuid) -> Result<Vec<SaasExecutor>, anyhow::Error> {
        let execs = self.executors.lock().unwrap();
        Ok(execs.iter().filter(|e| e.organization_id == Some(org_id)).cloned().collect())
    }

    pub async fn get_executor(&self, id: Uuid, org_id: Uuid) -> Result<Option<SaasExecutor>, anyhow::Error> {
        let execs = self.executors.lock().unwrap();
        Ok(execs.iter().find(|e| e.id == id && e.organization_id == Some(org_id)).cloned())
    }

    pub async fn delete_executor(&self, id: Uuid, org_id: Uuid) -> Result<(), anyhow::Error> {
        let mut execs = self.executors.lock().unwrap();
        execs.retain(|e| !(e.id == id && e.organization_id == Some(org_id)));
        Ok(())
    }

    // Test Suite CRUD
    pub async fn create_test_suite(&self, suite: &SaasTestSuite) -> Result<(), anyhow::Error> {
        let mut suites = self.test_suites.lock().unwrap();
        suites.push(suite.clone());
        Ok(())
    }

    pub async fn list_test_suites(&self, org_id: Uuid) -> Result<Vec<SaasTestSuite>, anyhow::Error> {
        let suites = self.test_suites.lock().unwrap();
        Ok(suites.iter().filter(|s| s.organization_id == Some(org_id)).cloned().collect())
    }

    pub async fn get_test_suite(&self, id: Uuid, org_id: Uuid) -> Result<Option<SaasTestSuite>, anyhow::Error> {
        let suites = self.test_suites.lock().unwrap();
        Ok(suites.iter().find(|s| s.id == id && s.organization_id == Some(org_id)).cloned())
    }

    pub async fn delete_test_suite(&self, id: Uuid, org_id: Uuid) -> Result<(), anyhow::Error> {
        let mut suites = self.test_suites.lock().unwrap();
        suites.retain(|s| !(s.id == id && s.organization_id == Some(org_id)));
        Ok(())
    }

    // Policy enforcement
    pub async fn check_run_limits(&self, org_id: Uuid) -> Result<bool, anyhow::Error> {
        let policy = self.get_organization_policy(org_id).await?;
        if let Some(policy) = policy {
            let runs = self.list_test_runs(org_id).await?;
            let running_count = runs.iter().filter(|r| r.status == "running").count() as i32;
            
            if running_count >= policy.max_concurrent_runs {
                return Ok(false);
            }
        }
        Ok(true)
    }

    // Seed data for development/testing
    pub async fn seed_sample_data(&self) -> Result<(), anyhow::Error> {
        let now = Utc::now();
        
        // Create organizations
        let org1 = Organization {
            id: Uuid::parse_str("550e8400-e29b-41d4-a716-446655440001").unwrap(),
            name: "Acme Corp".to_string(),
            slug: "acme".to_string(),
            created_at: now,
            updated_at: now,
        };
        
        let org2 = Organization {
            id: Uuid::parse_str("550e8400-e29b-41d4-a716-446655440002").unwrap(),
            name: "Beta Inc".to_string(),
            slug: "beta".to_string(),
            created_at: now,
            updated_at: now,
        };
        
        self.create_organization(&org1).await?;
        self.create_organization(&org2).await?;
        
        // Create a test user
        let user = User {
            id: Uuid::parse_str("550e8400-e29b-41d4-a716-446655440003").unwrap(),
            email: "test@example.com".to_string(),
            name: Some("Test User".to_string()),
            created_at: now,
            updated_at: now,
        };
        
        self.create_user(&user).await?;
        
        // Add user to both orgs with different roles
        let member1 = OrganizationMember {
            id: Uuid::parse_str("550e8400-e29b-41d4-a716-446655440004").unwrap(),
            organization_id: org1.id,
            user_id: user.id,
            role: "admin".to_string(),
            created_at: now,
            updated_at: now,
        };
        
        let member2 = OrganizationMember {
            id: Uuid::parse_str("550e8400-e29b-41d4-a716-446655440005").unwrap(),
            organization_id: org2.id,
            user_id: user.id,
            role: "developer".to_string(),
            created_at: now,
            updated_at: now,
        };
        
        self.create_organization_member(&member1).await?;
        self.create_organization_member(&member2).await?;
        
        // Create organization policies
        let policy1 = OrganizationPolicy {
            id: Uuid::parse_str("550e8400-e29b-41d4-a716-446655440006").unwrap(),
            organization_id: org1.id,
            max_concurrent_runs: 5,
            daily_cap: 100,
            created_at: now,
            updated_at: now,
        };
        
        let policy2 = OrganizationPolicy {
            id: Uuid::parse_str("550e8400-e29b-41d4-a716-446655440007").unwrap(),
            organization_id: org2.id,
            max_concurrent_runs: 3,
            daily_cap: 50,
            created_at: now,
            updated_at: now,
        };
        
        self.create_organization_policy(&policy1).await?;
        self.create_organization_policy(&policy2).await?;
        
        // Create sample test definitions for each org
        let def1 = SaasTestDefinition {
            id: Uuid::parse_str("550e8400-e29b-41d4-a716-446655440008").unwrap(),
            name: "Acme API Test".to_string(),
            description: Some("Basic API tests for Acme Corp".to_string()),
            code: "console.log('Running Acme API tests');".to_string(),
            language: "javascript".to_string(),
            created_at: now,
            updated_at: now,
            user_id: Some(user.id),
            organization_id: Some(org1.id),
            is_public: false,
        };
        
        let def2 = SaasTestDefinition {
            id: Uuid::parse_str("550e8400-e29b-41d4-a716-446655440009").unwrap(),
            name: "Beta Integration Test".to_string(),
            description: Some("Integration tests for Beta Inc".to_string()),
            code: "print('Running Beta integration tests')".to_string(),
            language: "python".to_string(),
            created_at: now,
            updated_at: now,
            user_id: Some(user.id),
            organization_id: Some(org2.id),
            is_public: false,
        };
        
        self.create_test_definition(&def1).await?;
        self.create_test_definition(&def2).await?;
        
        Ok(())
    }
}

// Organization context for requests
#[derive(Debug, Clone)]
pub struct OrgContext {
    pub organization_id: Uuid,
    pub user_id: Uuid,
    pub role: String,
}