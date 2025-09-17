use axum::{
    extract::{State},
    http::{StatusCode, HeaderMap},
    routing::{get, post},
    Json, Router,
    body::Bytes,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sparktest_saas_core::{
    Database, Plan, Organization, OrgSubscription
};
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use uuid::Uuid;
use chrono::Utc;
use stripe::{Client, CheckoutSession, CheckoutSessionMode, CreateCheckoutSession, CreateCheckoutSessionLineItems};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use hex;

pub type AppState = Arc<Database>;

// Billing types
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
        // Billing routes (public access)
        .route("/api/billing/plans", get(list_plans))
        .route("/api/billing/checkout", post(create_checkout_session))
        .route("/api/billing/webhook", post(handle_webhook))
        // Note: With Supabase, organization and test management would typically
        // be handled through Supabase's Row Level Security (RLS) policies
        // These routes are simplified placeholders for Supabase integration
        .layer(CorsLayer::permissive())
        .with_state(state)
}

async fn health_check() -> Json<Value> {
    Json(json!({ "status": "ok", "timestamp": Utc::now() }))
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
    
    println!("Created subscription for organization {}: {}", organization.id, subscription_id);
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
    
    println!("Marked subscription as canceled: {}", subscription_id);
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
}