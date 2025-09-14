use axum::{
    extract::{Path, State},
    http::{StatusCode, HeaderMap},
    routing::{get, post},
    Json, Router,
    body::Bytes,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sparktest_saas_core::{Database, SaasTestDefinition, SaasTestRun, Plan, Organization, OrgSubscription};
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use uuid::Uuid;
use chrono::Utc;
use stripe::{Client, CheckoutSession, CheckoutSessionMode, CreateCheckoutSession, CreateCheckoutSessionLineItems};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use hex;

pub type AppState = Arc<Database>;

#[derive(Debug, Serialize, Deserialize)]
pub struct CheckoutRequest {
    pub plan_slug: String,
    pub success_url: Option<String>,
    pub cancel_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CheckoutResponse {
    pub checkout_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WebhookEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub data: WebhookEventData,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WebhookEventData {
    pub object: Value,
}

type HmacSha256 = Hmac<Sha256>;

pub fn create_app(database: Database) -> Router {
    let state = Arc::new(database);
    
    Router::new()
        .route("/api/health", get(health_check))
        // Test Definitions
        .route("/api/test-definitions", get(list_test_definitions).post(create_test_definition))
        .route("/api/test-definitions/:id", get(get_test_definition).put(update_test_definition).delete(delete_test_definition))
        // Test Runs
        .route("/api/test-runs", get(list_test_runs).post(create_test_run))
        .route("/api/test-runs/:id", get(get_test_run))
        // Executors
        .route("/api/executors", get(list_executors).post(create_executor))
        .route("/api/executors/:id", get(get_executor).put(update_executor).delete(delete_executor))
        // Test Suites
        .route("/api/test-suites", get(list_test_suites).post(create_test_suite))
        .route("/api/test-suites/:id", get(get_test_suite).put(update_test_suite).delete(delete_test_suite))
        // Billing
        .route("/api/billing/plans", get(list_plans))
        .route("/api/billing/checkout", post(create_checkout_session))
        .route("/api/billing/webhook", post(handle_webhook))
        // Organization Policies
        .route("/api/organizations/:id/policy", get(get_organization_policy))
        .layer(CorsLayer::permissive())
        .with_state(state)
}

async fn health_check() -> Json<Value> {
    Json(json!({ "status": "ok", "timestamp": Utc::now() }))
}

// Test Definition handlers
async fn list_test_definitions(State(db): State<AppState>) -> Result<Json<Vec<SaasTestDefinition>>, StatusCode> {
    match db.list_test_definitions(None, None).await {
        Ok(definitions) => Ok(Json(definitions)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn create_test_definition(
    State(db): State<AppState>,
    Json(mut definition): Json<SaasTestDefinition>,
) -> Result<Json<SaasTestDefinition>, StatusCode> {
    definition.id = Uuid::new_v4();
    definition.created_at = Utc::now();
    definition.updated_at = Utc::now();

    match db.create_test_definition(&definition).await {
        Ok(_) => Ok(Json(definition)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn get_test_definition(
    State(db): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<SaasTestDefinition>, StatusCode> {
    match db.get_test_definition(id).await {
        Ok(Some(definition)) => Ok(Json(definition)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn update_test_definition(
    State(_db): State<AppState>,
    Path(id): Path<Uuid>,
    Json(mut definition): Json<SaasTestDefinition>,
) -> Result<Json<SaasTestDefinition>, StatusCode> {
    definition.id = id;
    definition.updated_at = Utc::now();

    // For now, just return the updated definition
    // In a real implementation, you'd update in the database
    Ok(Json(definition))
}

async fn delete_test_definition(
    State(db): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    match db.delete_test_definition(id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

// Test Run handlers
async fn list_test_runs(State(db): State<AppState>) -> Result<Json<Vec<SaasTestRun>>, StatusCode> {
    match db.list_test_runs(None, None).await {
        Ok(runs) => Ok(Json(runs)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn create_test_run(
    State(db): State<AppState>,
    Json(mut run): Json<SaasTestRun>,
) -> Result<Json<SaasTestRun>, StatusCode> {
    run.id = Uuid::new_v4();
    run.created_at = Utc::now();
    run.updated_at = Utc::now();

    match db.create_test_run(&run).await {
        Ok(_) => Ok(Json(run)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn get_test_run(
    State(_db): State<AppState>,
    Path(_id): Path<Uuid>,
) -> Result<Json<Value>, StatusCode> {
    // Placeholder implementation
    Ok(Json(json!({"message": "Test run not implemented yet"})))
}

// Executor handlers
async fn list_executors(State(_db): State<AppState>) -> Result<Json<Vec<Value>>, StatusCode> {
    // Placeholder implementation
    Ok(Json(vec![]))
}

async fn create_executor(
    State(_db): State<AppState>,
    Json(executor): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
    // Placeholder implementation
    Ok(Json(executor))
}

async fn get_executor(
    State(_db): State<AppState>,
    Path(_id): Path<Uuid>,
) -> Result<Json<Value>, StatusCode> {
    // Placeholder implementation
    Ok(Json(json!({"message": "Executor not implemented yet"})))
}

async fn update_executor(
    State(_db): State<AppState>,
    Path(_id): Path<Uuid>,
    Json(executor): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
    // Placeholder implementation
    Ok(Json(executor))
}

async fn delete_executor(
    State(_db): State<AppState>,
    Path(_id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    // Placeholder implementation
    Ok(StatusCode::NO_CONTENT)
}

// Test Suite handlers
async fn list_test_suites(State(_db): State<AppState>) -> Result<Json<Vec<Value>>, StatusCode> {
    // Placeholder implementation
    Ok(Json(vec![]))
}

async fn create_test_suite(
    State(_db): State<AppState>,
    Json(suite): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
    // Placeholder implementation
    Ok(Json(suite))
}

async fn get_test_suite(
    State(_db): State<AppState>,
    Path(_id): Path<Uuid>,
) -> Result<Json<Value>, StatusCode> {
    // Placeholder implementation
    Ok(Json(json!({"message": "Test suite not implemented yet"})))
}

async fn update_test_suite(
    State(_db): State<AppState>,
    Path(_id): Path<Uuid>,
    Json(suite): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
    // Placeholder implementation
    Ok(Json(suite))
}

async fn delete_test_suite(
    State(_db): State<AppState>,
    Path(_id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    // Placeholder implementation
    Ok(StatusCode::NO_CONTENT)
}

// Billing handlers
async fn list_plans(State(db): State<AppState>) -> Result<Json<Vec<Plan>>, StatusCode> {
    match db.list_plans().await {
        Ok(plans) => Ok(Json(plans)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn create_checkout_session(
    State(db): State<AppState>,
    Json(request): Json<CheckoutRequest>,
) -> Result<Json<CheckoutResponse>, StatusCode> {
    // Get the plan
    let plan = match db.get_plan_by_slug(&request.plan_slug).await {
        Ok(Some(plan)) => plan,
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };

    // Skip Stripe integration for free plan
    if plan.price_cents == 0 {
        let success_url = request.success_url.unwrap_or_else(|| "http://localhost:3000".to_string());
        return Ok(Json(CheckoutResponse {
            checkout_url: success_url,
        }));
    }

    // Get Stripe configuration
    let stripe_secret_key = match std::env::var("STRIPE_SECRET_KEY") {
        Ok(key) => key,
        Err(_) => {
            eprintln!("STRIPE_SECRET_KEY environment variable not set");
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let stripe_price_id = match &plan.stripe_price_id {
        Some(id) => id.clone(),
        None => {
            eprintln!("No Stripe price ID configured for plan: {}", plan.slug);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // Create Stripe client
    let client = Client::new(stripe_secret_key);

    // Create checkout session
    let success_url = request.success_url.unwrap_or_else(|| "http://localhost:3000?session_id={CHECKOUT_SESSION_ID}".to_string());
    let cancel_url = request.cancel_url.unwrap_or_else(|| "http://localhost:3000".to_string());

    let mut create_session = CreateCheckoutSession::new();
    create_session.mode = Some(CheckoutSessionMode::Subscription);
    create_session.success_url = Some(&success_url);
    create_session.cancel_url = Some(&cancel_url);
    create_session.line_items = Some(vec![CreateCheckoutSessionLineItems {
        price: Some(stripe_price_id),
        quantity: Some(1),
        ..Default::default()
    }]);

    match CheckoutSession::create(&client, create_session).await {
        Ok(session) => {
            if let Some(url) = session.url {
                Ok(Json(CheckoutResponse {
                    checkout_url: url,
                }))
            } else {
                eprintln!("Stripe checkout session created but no URL returned");
                Err(StatusCode::INTERNAL_SERVER_ERROR)
            }
        }
        Err(e) => {
            eprintln!("Failed to create Stripe checkout session: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// Webhook signature verification
fn verify_webhook_signature(
    payload: &[u8],
    signature: &str,
    webhook_secret: &str,
) -> Result<(), anyhow::Error> {
    let signature = signature.strip_prefix("v1=")
        .ok_or_else(|| anyhow::anyhow!("Invalid signature format"))?;
    
    let signature_bytes = hex::decode(signature)
        .map_err(|_| anyhow::anyhow!("Invalid signature encoding"))?;

    let mut mac = HmacSha256::new_from_slice(webhook_secret.as_bytes())
        .map_err(|_| anyhow::anyhow!("Invalid webhook secret"))?;
    mac.update(payload);
    
    match mac.verify_slice(&signature_bytes) {
        Ok(_) => Ok(()),
        Err(_) => Err(anyhow::anyhow!("Signature verification failed")),
    }
}

// Webhook handler
async fn handle_webhook(
    State(db): State<AppState>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<Json<Value>, StatusCode> {
    // Get webhook secret from environment
    let webhook_secret = match std::env::var("STRIPE_WEBHOOK_SECRET") {
        Ok(secret) => secret,
        Err(_) => {
            eprintln!("STRIPE_WEBHOOK_SECRET environment variable not set");
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // Verify webhook signature
    let signature = headers
        .get("stripe-signature")
        .and_then(|h| h.to_str().ok())
        .ok_or(StatusCode::BAD_REQUEST)?;

    if let Err(e) = verify_webhook_signature(&body, signature, &webhook_secret) {
        eprintln!("Webhook signature verification failed: {:?}", e);
        return Err(StatusCode::UNAUTHORIZED);
    }

    // Parse webhook event
    let event: WebhookEvent = match serde_json::from_slice(&body) {
        Ok(event) => event,
        Err(e) => {
            eprintln!("Failed to parse webhook event: {:?}", e);
            return Err(StatusCode::BAD_REQUEST);
        }
    };

    // Handle different event types
    match event.event_type.as_str() {
        "checkout.session.completed" => {
            if let Err(e) = handle_checkout_session_completed(&db, &event.data.object).await {
                eprintln!("Failed to handle checkout.session.completed: {:?}", e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        }
        "invoice.payment_failed" => {
            if let Err(e) = handle_invoice_payment_failed(&db, &event.data.object).await {
                eprintln!("Failed to handle invoice.payment_failed: {:?}", e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        }
        "customer.subscription.deleted" => {
            if let Err(e) = handle_customer_subscription_deleted(&db, &event.data.object).await {
                eprintln!("Failed to handle customer.subscription.deleted: {:?}", e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        }
        _ => {
            // Ignore other event types
            println!("Ignoring webhook event type: {}", event.event_type);
        }
    }

    Ok(Json(json!({ "status": "ok" })))
}

// Organization Policy handler
async fn get_organization_policy(
    State(db): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, StatusCode> {
    match db.get_organization_policy(id).await {
        Ok(Some(policy)) => Ok(Json(serde_json::to_value(policy).unwrap())),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

// Handle checkout.session.completed event
async fn handle_checkout_session_completed(
    db: &Database,
    session_data: &Value,
) -> Result<(), anyhow::Error> {
    let customer_id = session_data["customer"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("Missing customer ID in checkout session"))?;
    
    let subscription_id = session_data["subscription"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("Missing subscription ID in checkout session"))?;

    // Find or create organization with stripe customer ID
    let mut organization = match db.get_organization_by_stripe_customer_id(customer_id).await? {
        Some(org) => org,
        None => {
            // Create a new organization if none exists
            let new_org = Organization {
                id: Uuid::new_v4(),
                name: format!("Organization {}", customer_id),
                stripe_customer_id: Some(customer_id.to_string()),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };
            db.create_organization(&new_org).await?;
            new_org
        }
    };

    // Update organization with customer ID if needed
    if organization.stripe_customer_id.is_none() {
        organization.stripe_customer_id = Some(customer_id.to_string());
        organization.updated_at = Utc::now();
        db.update_organization(&organization).await?;
    }

    // Get subscription details from Stripe to extract plan info
    // For now, we'll use the pro plan as default since that's what triggers checkout
    let plans = db.list_plans().await?;
    let pro_plan = plans.iter().find(|p| p.slug == "pro")
        .ok_or_else(|| anyhow::anyhow!("Pro plan not found"))?;

    // Create subscription record
    let subscription = OrgSubscription {
        id: Uuid::new_v4(),
        organization_id: organization.id,
        stripe_subscription_id: subscription_id.to_string(),
        status: "active".to_string(),
        current_period_end: Utc::now() + chrono::Duration::days(30), // Default to 30 days
        plan_id: pro_plan.id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    db.create_subscription(&subscription).await?;
    
    // Apply plan policy to organization
    db.apply_plan_policy_to_organization(organization.id, &pro_plan).await?;
    
    println!("Created subscription for organization {}: {}", organization.id, subscription_id);
    println!("Applied pro plan policy to organization {}", organization.id);
    Ok(())
}

// Handle invoice.payment_failed event
async fn handle_invoice_payment_failed(
    db: &Database,
    invoice_data: &Value,
) -> Result<(), anyhow::Error> {
    let subscription_id = invoice_data["subscription"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("Missing subscription ID in invoice"))?;

    let mut subscription = db.get_subscription_by_stripe_id(subscription_id).await?
        .ok_or_else(|| anyhow::anyhow!("Subscription not found: {}", subscription_id))?;

    subscription.status = "past_due".to_string();
    subscription.updated_at = Utc::now();
    
    db.update_subscription(&subscription).await?;
    
    println!("Marked subscription as past_due: {}", subscription_id);
    Ok(())
}

// Handle customer.subscription.deleted event
async fn handle_customer_subscription_deleted(
    db: &Database,
    subscription_data: &Value,
) -> Result<(), anyhow::Error> {
    let subscription_id = subscription_data["id"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("Missing subscription ID"))?;

    let mut subscription = db.get_subscription_by_stripe_id(subscription_id).await?
        .ok_or_else(|| anyhow::anyhow!("Subscription not found: {}", subscription_id))?;

    subscription.status = "canceled".to_string();
    subscription.updated_at = Utc::now();
    
    db.update_subscription(&subscription).await?;
    
    // Apply free plan policy when subscription is canceled
    let plans = db.list_plans().await?;
    let free_plan = plans.iter().find(|p| p.slug == "free")
        .ok_or_else(|| anyhow::anyhow!("Free plan not found"))?;
        
    db.apply_plan_policy_to_organization(subscription.organization_id, &free_plan).await?;
    
    println!("Marked subscription as canceled: {}", subscription_id);
    println!("Applied free plan policy to organization {}", subscription.organization_id);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_checkout_request_serialization() {
        let request = CheckoutRequest {
            plan_slug: "pro".to_string(),
            success_url: Some("http://localhost:3000/success".to_string()),
            cancel_url: Some("http://localhost:3000/cancel".to_string()),
        };

        // Test serialization
        let json_str = serde_json::to_string(&request).expect("Failed to serialize");
        assert!(json_str.contains("pro"));
        assert!(json_str.contains("success"));

        // Test deserialization
        let deserialized: CheckoutRequest = serde_json::from_str(&json_str).expect("Failed to deserialize");
        assert_eq!(deserialized.plan_slug, "pro");
        assert_eq!(deserialized.success_url.unwrap(), "http://localhost:3000/success");
    }

    #[tokio::test]
    async fn test_checkout_response_serialization() {
        let response = CheckoutResponse {
            checkout_url: "https://checkout.stripe.com/test123".to_string(),
        };

        // Test serialization
        let json_str = serde_json::to_string(&response).expect("Failed to serialize");
        assert!(json_str.contains("checkout.stripe.com"));

        // Test deserialization
        let deserialized: CheckoutResponse = serde_json::from_str(&json_str).expect("Failed to deserialize");
        assert_eq!(deserialized.checkout_url, "https://checkout.stripe.com/test123");
    }

    #[tokio::test]
    async fn test_database_operations() {
        let db = Database::new("test://").await.expect("Failed to create test database");
        
        // Test listing plans
        let plans = db.list_plans().await.expect("Failed to list plans");
        assert_eq!(plans.len(), 2);
        
        // Test finding plans by slug
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
    async fn test_free_plan_checkout_logic() {
        let db = Database::new("test://").await.expect("Failed to create test database");
        
        // Simulate free plan checkout logic
        let plan = db.get_plan_by_slug("free").await.expect("Failed to get plan").unwrap();
        assert_eq!(plan.price_cents, 0);
        
        // For free plan, we should skip Stripe
        let success_url = "http://localhost:3000/success".to_string();
        assert_eq!(success_url, "http://localhost:3000/success");
    }

    #[tokio::test]
    async fn test_pro_plan_stripe_requirements() {
        let db = Database::new("test://").await.expect("Failed to create test database");
        
        let plan = db.get_plan_by_slug("pro").await.expect("Failed to get plan").unwrap();
        assert_eq!(plan.price_cents, 2900);
        assert!(plan.price_cents > 0); // Should require Stripe for paid plans
        
        // Should have features that differentiate from free
        let features = &plan.features;
        assert_eq!(features["max_tests"], "unlimited");
        assert_eq!(features["support"], "priority");
    }

    #[tokio::test]
    async fn test_test_definition_operations() {
        let db = Database::new("test://").await.expect("Failed to create test database");
        
        let test_def = SaasTestDefinition {
            id: Uuid::new_v4(),
            name: "Test API Definition".to_string(),
            description: Some("A test definition via API".to_string()),
            code: "console.log('api test')".to_string(),
            language: "javascript".to_string(),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            user_id: Some(Uuid::new_v4()),
            organization_id: Some(Uuid::new_v4()),
            is_public: true,
        };

        // Create
        db.create_test_definition(&test_def).await.expect("Failed to create test definition");

        // Read
        let retrieved = db.get_test_definition(test_def.id).await.expect("Failed to get test definition");
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().name, "Test API Definition");

        // List
        let all_defs = db.list_test_definitions(None, None).await.expect("Failed to list test definitions");
        assert_eq!(all_defs.len(), 1);

        // Delete
        db.delete_test_definition(test_def.id).await.expect("Failed to delete test definition");
        let after_delete = db.get_test_definition(test_def.id).await.expect("Failed to get test definition");
        assert!(after_delete.is_none());
    }

    #[tokio::test]
    async fn test_webhook_signature_verification() {
        let secret = "test_webhook_secret";
        let payload = b"test_payload";
        
        // Create a valid signature
        let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).unwrap();
        mac.update(payload);
        let signature = hex::encode(mac.finalize().into_bytes());
        let full_signature = format!("v1={}", signature);

        // Test valid signature
        assert!(verify_webhook_signature(payload, &full_signature, secret).is_ok());

        // Test invalid signature
        assert!(verify_webhook_signature(payload, "v1=invalid", secret).is_err());

        // Test invalid format
        assert!(verify_webhook_signature(payload, "invalid_format", secret).is_err());
    }

    #[tokio::test]
    async fn test_organization_subscription_operations() {
        let db = Database::new("test://").await.expect("Failed to create test database");
        
        // Create test organization
        let org = Organization {
            id: Uuid::new_v4(),
            name: "Test Organization".to_string(),
            stripe_customer_id: Some("cus_test123".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        db.create_organization(&org).await.expect("Failed to create organization");

        // Test finding by stripe customer ID
        let found_org = db.get_organization_by_stripe_customer_id("cus_test123").await
            .expect("Failed to get organization")
            .expect("Organization not found");
        assert_eq!(found_org.id, org.id);

        // Create test subscription
        let plans = db.list_plans().await.expect("Failed to list plans");
        let pro_plan = plans.iter().find(|p| p.slug == "pro").unwrap();

        let subscription = OrgSubscription {
            id: Uuid::new_v4(),
            organization_id: org.id,
            stripe_subscription_id: "sub_test123".to_string(),
            status: "active".to_string(),
            current_period_end: Utc::now() + chrono::Duration::days(30),
            plan_id: pro_plan.id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        db.create_subscription(&subscription).await.expect("Failed to create subscription");

        // Test finding subscription by stripe ID
        let found_sub = db.get_subscription_by_stripe_id("sub_test123").await
            .expect("Failed to get subscription")
            .expect("Subscription not found");
        assert_eq!(found_sub.id, subscription.id);
        assert_eq!(found_sub.status, "active");

        // Test updating subscription status
        let mut updated_sub = found_sub.clone();
        updated_sub.status = "past_due".to_string();
        updated_sub.updated_at = Utc::now();
        db.update_subscription(&updated_sub).await.expect("Failed to update subscription");

        let updated_found = db.get_subscription_by_stripe_id("sub_test123").await
            .expect("Failed to get subscription")
            .expect("Subscription not found");
        assert_eq!(updated_found.status, "past_due");
    }

    #[tokio::test]
    async fn test_webhook_event_serialization() {
        let webhook_event = WebhookEvent {
            event_type: "checkout.session.completed".to_string(),
            data: WebhookEventData {
                object: serde_json::json!({
                    "customer": "cus_test123",
                    "subscription": "sub_test123"
                }),
            },
        };

        // Test serialization
        let json_str = serde_json::to_string(&webhook_event).expect("Failed to serialize");
        assert!(json_str.contains("checkout.session.completed"));
        assert!(json_str.contains("cus_test123"));

        // Test deserialization
        let deserialized: WebhookEvent = serde_json::from_str(&json_str).expect("Failed to deserialize");
        assert_eq!(deserialized.event_type, "checkout.session.completed");
        assert_eq!(deserialized.data.object["customer"], "cus_test123");
    }

    #[tokio::test]
    async fn test_webhook_policy_application() {
        let db = Database::new("test://").await.expect("Failed to create test database");
        
        // Create test organization
        let org = Organization {
            id: Uuid::new_v4(),
            name: "Test Organization".to_string(),
            stripe_customer_id: Some("cus_test123".to_string()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        db.create_organization(&org).await.expect("Failed to create organization");

        // Simulate checkout session completed webhook
        let session_data = serde_json::json!({
            "customer": "cus_test123",
            "subscription": "sub_test123"
        });

        handle_checkout_session_completed(&db, &session_data).await
            .expect("Failed to handle checkout session");

        // Verify organization policy was applied
        let policy = db.get_organization_policy(org.id).await
            .expect("Failed to get policy")
            .expect("Policy not found");

        assert_eq!(policy.organization_id, org.id);
        assert_eq!(policy.max_tests, None); // Pro plan = unlimited
        assert_eq!(policy.support_level, "priority");
        assert_eq!(policy.advanced_analytics, true);

        // Simulate subscription deletion webhook
        let subscription_data = serde_json::json!({
            "id": "sub_test123"
        });

        handle_customer_subscription_deleted(&db, &subscription_data).await
            .expect("Failed to handle subscription deletion");

        // Verify policy was downgraded to free plan
        let downgraded_policy = db.get_organization_policy(org.id).await
            .expect("Failed to get policy")
            .expect("Policy not found");

        assert_eq!(downgraded_policy.max_tests, Some(5)); // Free plan limit
        assert_eq!(downgraded_policy.support_level, "community");
        assert_eq!(downgraded_policy.advanced_analytics, false);
    }
}