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
    pub stripe_customer_id: Option<String>,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Plan {
    pub id: Uuid,
    pub slug: String,
    pub price_cents: i32,
    pub features: serde_json::Value,
    pub stripe_price_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrgSubscription {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub stripe_subscription_id: String,
    pub status: String, // active, past_due, canceled, etc.
    pub current_period_end: DateTime<Utc>,
    pub plan_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrganizationPolicy {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub max_tests: Option<i32>, // None means unlimited
    pub max_runs_per_month: Option<i32>, // None means unlimited
    pub retention_days: i32,
    pub support_level: String, // "community", "priority", "enterprise"
    pub advanced_analytics: bool,
    pub team_collaboration: bool,
    pub custom_overrides: serde_json::Value, // Store any custom policy overrides
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Simplified database operations (placeholder implementation)
pub struct Database {
    // For now, use in-memory storage
    test_definitions: std::sync::Arc<std::sync::Mutex<Vec<SaasTestDefinition>>>,
    test_runs: std::sync::Arc<std::sync::Mutex<Vec<SaasTestRun>>>,
    plans: std::sync::Arc<std::sync::Mutex<Vec<Plan>>>,
    organizations: std::sync::Arc<std::sync::Mutex<Vec<Organization>>>,
    subscriptions: std::sync::Arc<std::sync::Mutex<Vec<OrgSubscription>>>,
    organization_policies: std::sync::Arc<std::sync::Mutex<Vec<OrganizationPolicy>>>,
}

impl Database {
    pub async fn new(_database_url: &str) -> Result<Self, anyhow::Error> {
        // Placeholder implementation - in production this would connect to PostgreSQL
        let db = Self {
            test_definitions: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
            test_runs: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
            plans: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
            organizations: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
            subscriptions: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
            organization_policies: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
        };
        
        // Initialize with default plans
        db.init_default_plans().await?;
        
        Ok(db)
    }

    async fn init_default_plans(&self) -> Result<(), anyhow::Error> {
        let mut plans = self.plans.lock().unwrap();
        
        // Free plan
        plans.push(Plan {
            id: Uuid::new_v4(),
            slug: "free".to_string(),
            price_cents: 0,
            features: serde_json::json!({
                "max_tests": 5,
                "max_runs_per_month": 100,
                "support": "community",
                "policy_defaults": {
                    "max_tests": 5,
                    "max_runs_per_month": 100,
                    "retention_days": 30,
                    "support_level": "community",
                    "advanced_analytics": false,
                    "team_collaboration": false
                }
            }),
            stripe_price_id: std::env::var("STRIPE_FREE_PRICE_ID").ok(),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        });

        // Pro plan
        plans.push(Plan {
            id: Uuid::new_v4(),
            slug: "pro".to_string(),
            price_cents: 2900, // $29.00
            features: serde_json::json!({
                "max_tests": "unlimited",
                "max_runs_per_month": "unlimited",
                "support": "priority",
                "advanced_analytics": true,
                "team_collaboration": true,
                "policy_defaults": {
                    "max_tests": null,
                    "max_runs_per_month": null,
                    "retention_days": 90,
                    "support_level": "priority",
                    "advanced_analytics": true,
                    "team_collaboration": true
                }
            }),
            stripe_price_id: std::env::var("STRIPE_PRO_PRICE_ID").ok(),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        });

        Ok(())
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

    // Plan CRUD
    pub async fn list_plans(&self) -> Result<Vec<Plan>, anyhow::Error> {
        let plans = self.plans.lock().unwrap();
        Ok(plans.clone())
    }

    pub async fn get_plan_by_slug(&self, slug: &str) -> Result<Option<Plan>, anyhow::Error> {
        let plans = self.plans.lock().unwrap();
        Ok(plans.iter().find(|p| p.slug == slug).cloned())
    }

    // Organization CRUD
    pub async fn create_organization(&self, organization: &Organization) -> Result<(), anyhow::Error> {
        let mut orgs = self.organizations.lock().unwrap();
        orgs.push(organization.clone());
        Ok(())
    }

    pub async fn get_organization_by_id(&self, id: Uuid) -> Result<Option<Organization>, anyhow::Error> {
        let orgs = self.organizations.lock().unwrap();
        Ok(orgs.iter().find(|o| o.id == id).cloned())
    }

    pub async fn get_organization_by_stripe_customer_id(&self, stripe_customer_id: &str) -> Result<Option<Organization>, anyhow::Error> {
        let orgs = self.organizations.lock().unwrap();
        Ok(orgs.iter().find(|o| o.stripe_customer_id.as_ref() == Some(&stripe_customer_id.to_string())).cloned())
    }

    pub async fn update_organization(&self, organization: &Organization) -> Result<(), anyhow::Error> {
        let mut orgs = self.organizations.lock().unwrap();
        if let Some(pos) = orgs.iter().position(|o| o.id == organization.id) {
            orgs[pos] = organization.clone();
        }
        Ok(())
    }

    // Subscription CRUD
    pub async fn create_subscription(&self, subscription: &OrgSubscription) -> Result<(), anyhow::Error> {
        let mut subs = self.subscriptions.lock().unwrap();
        subs.push(subscription.clone());
        Ok(())
    }

    pub async fn get_subscription_by_stripe_id(&self, stripe_subscription_id: &str) -> Result<Option<OrgSubscription>, anyhow::Error> {
        let subs = self.subscriptions.lock().unwrap();
        Ok(subs.iter().find(|s| s.stripe_subscription_id == stripe_subscription_id).cloned())
    }

    pub async fn get_subscription_by_organization_id(&self, organization_id: Uuid) -> Result<Option<OrgSubscription>, anyhow::Error> {
        let subs = self.subscriptions.lock().unwrap();
        Ok(subs.iter().find(|s| s.organization_id == organization_id).cloned())
    }

    pub async fn update_subscription(&self, subscription: &OrgSubscription) -> Result<(), anyhow::Error> {
        let mut subs = self.subscriptions.lock().unwrap();
        if let Some(pos) = subs.iter().position(|s| s.id == subscription.id) {
            subs[pos] = subscription.clone();
        }
        Ok(())
    }

    // Organization Policy CRUD
    pub async fn create_organization_policy(&self, policy: &OrganizationPolicy) -> Result<(), anyhow::Error> {
        let mut policies = self.organization_policies.lock().unwrap();
        policies.push(policy.clone());
        Ok(())
    }

    pub async fn get_organization_policy(&self, organization_id: Uuid) -> Result<Option<OrganizationPolicy>, anyhow::Error> {
        let policies = self.organization_policies.lock().unwrap();
        Ok(policies.iter().find(|p| p.organization_id == organization_id).cloned())
    }

    pub async fn update_organization_policy(&self, policy: &OrganizationPolicy) -> Result<(), anyhow::Error> {
        let mut policies = self.organization_policies.lock().unwrap();
        if let Some(pos) = policies.iter().position(|p| p.id == policy.id) {
            policies[pos] = policy.clone();
        }
        Ok(())
    }

    pub async fn upsert_organization_policy(&self, policy: &OrganizationPolicy) -> Result<(), anyhow::Error> {
        let mut policies = self.organization_policies.lock().unwrap();
        if let Some(pos) = policies.iter().position(|p| p.organization_id == policy.organization_id) {
            policies[pos] = policy.clone();
        } else {
            policies.push(policy.clone());
        }
        Ok(())
    }

    // Apply plan policy defaults while preserving custom overrides
    pub async fn apply_plan_policy_to_organization(&self, organization_id: Uuid, plan: &Plan) -> Result<(), anyhow::Error> {
        let policy_defaults = plan.features["policy_defaults"].as_object()
            .ok_or_else(|| anyhow::anyhow!("Plan {} has no policy defaults", plan.slug))?;

        // Get existing policy or create a new one
        let existing_policy = self.get_organization_policy(organization_id).await?;
        let custom_overrides = existing_policy
            .as_ref()
            .map(|p| p.custom_overrides.clone())
            .unwrap_or_else(|| serde_json::json!({}));

        let policy = OrganizationPolicy {
            id: existing_policy.as_ref().map(|p| p.id).unwrap_or_else(Uuid::new_v4),
            organization_id,
            max_tests: policy_defaults.get("max_tests")
                .and_then(|v| v.as_i64())
                .map(|v| v as i32),
            max_runs_per_month: policy_defaults.get("max_runs_per_month")
                .and_then(|v| v.as_i64())
                .map(|v| v as i32),
            retention_days: policy_defaults.get("retention_days")
                .and_then(|v| v.as_i64())
                .map(|v| v as i32)
                .unwrap_or(30),
            support_level: policy_defaults.get("support_level")
                .and_then(|v| v.as_str())
                .unwrap_or("community")
                .to_string(),
            advanced_analytics: policy_defaults.get("advanced_analytics")
                .and_then(|v| v.as_bool())
                .unwrap_or(false),
            team_collaboration: policy_defaults.get("team_collaboration")
                .and_then(|v| v.as_bool())
                .unwrap_or(false),
            custom_overrides,
            created_at: existing_policy.as_ref().map(|p| p.created_at).unwrap_or_else(Utc::now),
            updated_at: Utc::now(),
        };

        self.upsert_organization_policy(&policy).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_database_initialization() {
        let db = Database::new("test://").await.expect("Failed to create database");
        let plans = db.list_plans().await.expect("Failed to list plans");
        
        assert_eq!(plans.len(), 2);
        assert!(plans.iter().any(|p| p.slug == "free"));
        assert!(plans.iter().any(|p| p.slug == "pro"));
    }

    #[tokio::test]
    async fn test_plan_model_serialization() {
        let plan = Plan {
            id: Uuid::new_v4(),
            slug: "test".to_string(),
            price_cents: 1000,
            features: serde_json::json!({
                "feature1": true,
                "feature2": "value"
            }),
            stripe_price_id: Some("price_test123".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Test serialization
        let json = serde_json::to_string(&plan).expect("Failed to serialize plan");
        assert!(json.contains("test"));
        assert!(json.contains("1000"));

        // Test deserialization
        let deserialized: Plan = serde_json::from_str(&json).expect("Failed to deserialize plan");
        assert_eq!(deserialized.slug, "test");
        assert_eq!(deserialized.price_cents, 1000);
    }

    #[tokio::test]
    async fn test_get_plan_by_slug() {
        let db = Database::new("test://").await.expect("Failed to create database");
        
        // Test finding existing plan
        let free_plan = db.get_plan_by_slug("free").await.expect("Failed to get plan");
        assert!(free_plan.is_some());
        assert_eq!(free_plan.unwrap().price_cents, 0);

        let pro_plan = db.get_plan_by_slug("pro").await.expect("Failed to get plan");
        assert!(pro_plan.is_some());
        assert_eq!(pro_plan.unwrap().price_cents, 2900);

        // Test non-existent plan
        let nonexistent = db.get_plan_by_slug("nonexistent").await.expect("Failed to get plan");
        assert!(nonexistent.is_none());
    }

    #[tokio::test]
    async fn test_default_plan_features() {
        let db = Database::new("test://").await.expect("Failed to create database");
        
        let free_plan = db.get_plan_by_slug("free").await.expect("Failed to get plan").unwrap();
        let features = free_plan.features;
        assert_eq!(features["max_tests"], 5);
        assert_eq!(features["support"], "community");

        let pro_plan = db.get_plan_by_slug("pro").await.expect("Failed to get plan").unwrap();
        let features = pro_plan.features;
        assert_eq!(features["max_tests"], "unlimited");
        assert_eq!(features["support"], "priority");
        assert_eq!(features["advanced_analytics"], true);
    }

    #[tokio::test]
    async fn test_test_definition_crud() {
        let db = Database::new("test://").await.expect("Failed to create database");
        
        let test_def = SaasTestDefinition {
            id: Uuid::new_v4(),
            name: "Test Definition".to_string(),
            description: Some("A test definition".to_string()),
            code: "console.log('test')".to_string(),
            language: "javascript".to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            user_id: Some(Uuid::new_v4()),
            organization_id: Some(Uuid::new_v4()),
            is_public: false,
        };

        // Create
        db.create_test_definition(&test_def).await.expect("Failed to create test definition");

        // Read
        let retrieved = db.get_test_definition(test_def.id).await.expect("Failed to get test definition");
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().name, "Test Definition");

        // List
        let all_defs = db.list_test_definitions(None, None).await.expect("Failed to list test definitions");
        assert_eq!(all_defs.len(), 1);

        // Delete
        db.delete_test_definition(test_def.id).await.expect("Failed to delete test definition");
        let after_delete = db.get_test_definition(test_def.id).await.expect("Failed to get test definition");
        assert!(after_delete.is_none());
    }

    #[tokio::test]
    async fn test_organization_policy_mapping() {
        let db = Database::new("test://").await.expect("Failed to create database");
        let organization_id = Uuid::new_v4();
        
        // Test applying free plan policy
        let free_plan = db.get_plan_by_slug("free").await.expect("Failed to get plan").unwrap();
        db.apply_plan_policy_to_organization(organization_id, &free_plan).await
            .expect("Failed to apply free plan policy");
        
        let policy = db.get_organization_policy(organization_id).await
            .expect("Failed to get policy")
            .expect("Policy not found");
        
        assert_eq!(policy.organization_id, organization_id);
        assert_eq!(policy.max_tests, Some(5));
        assert_eq!(policy.max_runs_per_month, Some(100));
        assert_eq!(policy.retention_days, 30);
        assert_eq!(policy.support_level, "community");
        assert_eq!(policy.advanced_analytics, false);
        assert_eq!(policy.team_collaboration, false);
        
        // Test upgrading to pro plan
        let pro_plan = db.get_plan_by_slug("pro").await.expect("Failed to get plan").unwrap();
        db.apply_plan_policy_to_organization(organization_id, &pro_plan).await
            .expect("Failed to apply pro plan policy");
        
        let updated_policy = db.get_organization_policy(organization_id).await
            .expect("Failed to get policy")
            .expect("Policy not found");
        
        assert_eq!(updated_policy.organization_id, organization_id);
        assert_eq!(updated_policy.max_tests, None); // unlimited
        assert_eq!(updated_policy.max_runs_per_month, None); // unlimited
        assert_eq!(updated_policy.retention_days, 90);
        assert_eq!(updated_policy.support_level, "priority");
        assert_eq!(updated_policy.advanced_analytics, true);
        assert_eq!(updated_policy.team_collaboration, true);
        
        // Test that custom overrides are preserved
        let mut policy_with_overrides = updated_policy.clone();
        policy_with_overrides.custom_overrides = serde_json::json!({
            "custom_setting": "custom_value"
        });
        db.upsert_organization_policy(&policy_with_overrides).await
            .expect("Failed to save custom policy");
        
        // Apply free plan again and check overrides are preserved
        db.apply_plan_policy_to_organization(organization_id, &free_plan).await
            .expect("Failed to apply free plan policy again");
        
        let final_policy = db.get_organization_policy(organization_id).await
            .expect("Failed to get policy")
            .expect("Policy not found");
        
        assert_eq!(final_policy.max_tests, Some(5)); // Plan default applied
        assert_eq!(final_policy.custom_overrides["custom_setting"], "custom_value"); // Override preserved
    }
}