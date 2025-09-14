use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey};
use bcrypt::{hash, verify, DEFAULT_COST};

// JWT Claims structure
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // User ID
    pub email: String,
    pub org_id: Option<String>, // Current organization ID
    pub role: Option<MemberRole>, // Role in current organization
    pub exp: usize, // Expiration time
    pub iat: usize, // Issued at
}

// Auth utilities
pub struct AuthUtils;

impl AuthUtils {
    pub fn hash_password(password: &str) -> Result<String, anyhow::Error> {
        Ok(hash(password, DEFAULT_COST)?)
    }

    pub fn verify_password(password: &str, hash: &str) -> Result<bool, anyhow::Error> {
        Ok(verify(password, hash)?)
    }

    pub fn generate_jwt(
        user_id: Uuid,
        email: &str,
        org_id: Option<Uuid>,
        role: Option<MemberRole>,
        secret: &str,
    ) -> Result<String, anyhow::Error> {
        let exp = (Utc::now() + chrono::Duration::hours(24)).timestamp() as usize;
        let iat = Utc::now().timestamp() as usize;

        let claims = Claims {
            sub: user_id.to_string(),
            email: email.to_string(),
            org_id: org_id.map(|id| id.to_string()),
            role,
            exp,
            iat,
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(secret.as_ref()),
        )?;

        Ok(token)
    }

    pub fn verify_jwt(token: &str, secret: &str) -> Result<Claims, anyhow::Error> {
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_ref()),
            &Validation::new(Algorithm::HS256),
        )?;

        Ok(token_data.claims)
    }
}

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
    pub password_hash: Option<String>, // For local auth
    pub external_provider_id: Option<String>, // For OAuth (Google, GitHub, etc.)
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrganizationMember {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub user_id: Uuid,
    pub role: MemberRole,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MemberRole {
    Owner,
    Member,
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

// Simplified database operations (placeholder implementation)
pub struct Database {
    // For now, use in-memory storage
    test_definitions: std::sync::Arc<std::sync::Mutex<Vec<SaasTestDefinition>>>,
    test_runs: std::sync::Arc<std::sync::Mutex<Vec<SaasTestRun>>>,
    plans: std::sync::Arc<std::sync::Mutex<Vec<Plan>>>,
    organizations: std::sync::Arc<std::sync::Mutex<Vec<Organization>>>,
    subscriptions: std::sync::Arc<std::sync::Mutex<Vec<OrgSubscription>>>,
    users: std::sync::Arc<std::sync::Mutex<Vec<User>>>,
    organization_members: std::sync::Arc<std::sync::Mutex<Vec<OrganizationMember>>>,
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
            users: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
            organization_members: std::sync::Arc::new(std::sync::Mutex::new(Vec::new())),
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
                "support": "community"
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
                "team_collaboration": true
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

    // User CRUD
    pub async fn create_user(&self, user: &User) -> Result<(), anyhow::Error> {
        let mut users = self.users.lock().unwrap();
        users.push(user.clone());
        Ok(())
    }

    pub async fn get_user_by_id(&self, id: Uuid) -> Result<Option<User>, anyhow::Error> {
        let users = self.users.lock().unwrap();
        Ok(users.iter().find(|u| u.id == id).cloned())
    }

    pub async fn get_user_by_email(&self, email: &str) -> Result<Option<User>, anyhow::Error> {
        let users = self.users.lock().unwrap();
        Ok(users.iter().find(|u| u.email == email).cloned())
    }

    pub async fn update_user(&self, user: &User) -> Result<(), anyhow::Error> {
        let mut users = self.users.lock().unwrap();
        if let Some(pos) = users.iter().position(|u| u.id == user.id) {
            users[pos] = user.clone();
        }
        Ok(())
    }

    // Organization Member CRUD
    pub async fn create_organization_member(&self, member: &OrganizationMember) -> Result<(), anyhow::Error> {
        let mut members = self.organization_members.lock().unwrap();
        members.push(member.clone());
        Ok(())
    }

    pub async fn get_organization_members(&self, organization_id: Uuid) -> Result<Vec<OrganizationMember>, anyhow::Error> {
        let members = self.organization_members.lock().unwrap();
        Ok(members.iter().filter(|m| m.organization_id == organization_id).cloned().collect())
    }

    pub async fn get_user_organizations(&self, user_id: Uuid) -> Result<Vec<(Organization, MemberRole)>, anyhow::Error> {
        let members = self.organization_members.lock().unwrap();
        let orgs = self.organizations.lock().unwrap();
        
        let user_memberships: Vec<&OrganizationMember> = members.iter()
            .filter(|m| m.user_id == user_id)
            .collect();
        
        let mut result = Vec::new();
        for membership in user_memberships {
            if let Some(org) = orgs.iter().find(|o| o.id == membership.organization_id) {
                result.push((org.clone(), membership.role.clone()));
            }
        }
        
        Ok(result)
    }

    pub async fn get_organization_member(&self, organization_id: Uuid, user_id: Uuid) -> Result<Option<OrganizationMember>, anyhow::Error> {
        let members = self.organization_members.lock().unwrap();
        Ok(members.iter().find(|m| m.organization_id == organization_id && m.user_id == user_id).cloned())
    }

    pub async fn remove_organization_member(&self, organization_id: Uuid, user_id: Uuid) -> Result<(), anyhow::Error> {
        let mut members = self.organization_members.lock().unwrap();
        members.retain(|m| !(m.organization_id == organization_id && m.user_id == user_id));
        Ok(())
    }

    pub async fn update_organization_member(&self, member: &OrganizationMember) -> Result<(), anyhow::Error> {
        let mut members = self.organization_members.lock().unwrap();
        if let Some(pos) = members.iter().position(|m| m.id == member.id) {
            members[pos] = member.clone();
        }
        Ok(())
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
    async fn test_user_crud() {
        let db = Database::new("test://").await.expect("Failed to create database");
        
        let user = User {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            name: Some("Test User".to_string()),
            password_hash: Some("hashed_password".to_string()),
            external_provider_id: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Create
        db.create_user(&user).await.expect("Failed to create user");

        // Read by ID
        let retrieved = db.get_user_by_id(user.id).await.expect("Failed to get user");
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().email, "test@example.com");

        // Read by email
        let by_email = db.get_user_by_email("test@example.com").await.expect("Failed to get user");
        assert!(by_email.is_some());
        assert_eq!(by_email.unwrap().id, user.id);
    }

    #[tokio::test]
    async fn test_organization_member_crud() {
        let db = Database::new("test://").await.expect("Failed to create database");
        
        // Create test user and organization
        let user = User {
            id: Uuid::new_v4(),
            email: "member@example.com".to_string(),
            name: Some("Member User".to_string()),
            password_hash: Some("hashed_password".to_string()),
            external_provider_id: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        db.create_user(&user).await.expect("Failed to create user");

        let org = Organization {
            id: Uuid::new_v4(),
            name: "Test Organization".to_string(),
            stripe_customer_id: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        db.create_organization(&org).await.expect("Failed to create organization");

        let member = OrganizationMember {
            id: Uuid::new_v4(),
            organization_id: org.id,
            user_id: user.id,
            role: MemberRole::Owner,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Create membership
        db.create_organization_member(&member).await.expect("Failed to create member");

        // Test getting organization members
        let org_members = db.get_organization_members(org.id).await.expect("Failed to get members");
        assert_eq!(org_members.len(), 1);
        assert_eq!(org_members[0].role, MemberRole::Owner);

        // Test getting user organizations
        let user_orgs = db.get_user_organizations(user.id).await.expect("Failed to get user orgs");
        assert_eq!(user_orgs.len(), 1);
        assert_eq!(user_orgs[0].1, MemberRole::Owner);

        // Test getting specific membership
        let membership = db.get_organization_member(org.id, user.id).await.expect("Failed to get membership");
        assert!(membership.is_some());
        assert_eq!(membership.unwrap().role, MemberRole::Owner);
    }

    #[tokio::test]
    async fn test_auth_utils_password() {
        let password = "test_password_123";
        
        // Test password hashing
        let hash = AuthUtils::hash_password(password).expect("Failed to hash password");
        assert!(hash.len() > 0);
        assert_ne!(hash, password); // Should be different from original

        // Test password verification
        let is_valid = AuthUtils::verify_password(password, &hash).expect("Failed to verify password");
        assert!(is_valid);

        // Test wrong password
        let is_invalid = AuthUtils::verify_password("wrong_password", &hash).expect("Failed to verify password");
        assert!(!is_invalid);
    }

    #[tokio::test]
    async fn test_auth_utils_jwt() {
        let user_id = Uuid::new_v4();
        let email = "test@example.com";
        let org_id = Some(Uuid::new_v4());
        let role = Some(MemberRole::Owner);
        let secret = "test_secret_key_for_jwt";

        // Test JWT generation
        let token = AuthUtils::generate_jwt(user_id, email, org_id, role.clone(), secret)
            .expect("Failed to generate JWT");
        assert!(token.len() > 0);

        // Test JWT verification
        let claims = AuthUtils::verify_jwt(&token, secret).expect("Failed to verify JWT");
        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.email, email);
        assert_eq!(claims.org_id, org_id.map(|id| id.to_string()));
        assert_eq!(claims.role, role);

        // Test invalid secret
        let invalid_result = AuthUtils::verify_jwt(&token, "wrong_secret");
        assert!(invalid_result.is_err());
    }
}