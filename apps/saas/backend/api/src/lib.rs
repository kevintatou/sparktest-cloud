use axum::{
    extract::{Path, State, Request, FromRequestParts},
    http::{StatusCode, HeaderMap, request::Parts},
    routing::{get, post, delete},
    Json, Router,
    body::Bytes,
    middleware::{self, Next},
    response::Response,
    async_trait,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sparktest_saas_core::{
    Database, SaasTestDefinition, SaasTestRun, Plan, Organization, OrgSubscription,
    User, OrganizationMember, MemberRole, AuthUtils
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

// Auth types
#[derive(Debug, Serialize, Deserialize)]
pub struct SignupRequest {
    pub email: String,
    pub password: String,
    pub name: Option<String>,
    pub organization_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
    pub organization_id: Option<Uuid>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserInfo,
    pub organization: Option<OrganizationInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserInfo {
    pub id: Uuid,
    pub email: String,
    pub name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrganizationInfo {
    pub id: Uuid,
    pub name: String,
    pub role: MemberRole,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InviteMemberRequest {
    pub email: String,
    pub role: MemberRole,
}

// Auth context that gets added to requests
#[derive(Debug, Clone)]
pub struct AuthContext {
    pub user_id: Uuid,
    pub email: String,
    pub organization_id: Option<Uuid>,
    pub role: Option<MemberRole>,
}

// Custom extractor for AuthContext
#[async_trait]
impl<S> FromRequestParts<S> for AuthContext
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<AuthContext>()
            .cloned()
            .ok_or(StatusCode::UNAUTHORIZED)
    }
}

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
        // Auth routes (no auth required)
        .route("/api/auth/signup", post(auth_signup))
        .route("/api/auth/login", post(auth_login))
        // Protected routes (auth required)
        .route("/api/auth/me", get(auth_me))
        .route("/api/auth/logout", post(auth_logout))
        .route("/api/auth/switch-org/:org_id", post(auth_switch_organization))
        // Organization management
        .route("/api/organizations", get(list_user_organizations).post(create_organization))
        .route("/api/organizations/:org_id/members", get(list_organization_members).post(invite_member))
        .route("/api/organizations/:org_id/members/:user_id", delete(remove_member))
        // Test Definitions (protected)
        .route("/api/test-definitions", get(list_test_definitions).post(create_test_definition))
        .route("/api/test-definitions/:id", get(get_test_definition).put(update_test_definition).delete(delete_test_definition))
        // Test Runs (protected)
        .route("/api/test-runs", get(list_test_runs).post(create_test_run))
        .route("/api/test-runs/:id", get(get_test_run))
        // Executors (protected)
        .route("/api/executors", get(list_executors).post(create_executor))
        .route("/api/executors/:id", get(get_executor).put(update_executor).delete(delete_executor))
        // Test Suites (protected)
        .route("/api/test-suites", get(list_test_suites).post(create_test_suite))
        .route("/api/test-suites/:id", get(get_test_suite).put(update_test_suite).delete(delete_test_suite))
        // Billing
        .route("/api/billing/plans", get(list_plans))
        .route("/api/billing/checkout", post(create_checkout_session))
        .route("/api/billing/webhook", post(handle_webhook))
        // Add auth middleware to protected routes
        .layer(middleware::from_fn_with_state(state.clone(), auth_middleware))
        .layer(CorsLayer::permissive())
        .with_state(state)
}

async fn health_check() -> Json<Value> {
    Json(json!({ "status": "ok", "timestamp": Utc::now() }))
}

// Auth middleware
async fn auth_middleware(
    State(db): State<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Skip auth for certain routes
    let path = request.uri().path();
    if path == "/api/health" 
        || path == "/api/auth/signup" 
        || path == "/api/auth/login"
        || path == "/api/billing/plans"
        || path == "/api/billing/webhook" {
        return Ok(next.run(request).await);
    }

    // Get JWT secret from environment
    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "default_secret_key".to_string());

    // Extract token from Authorization header
    let auth_header = request
        .headers()
        .get("authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(token) => token,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    // Verify JWT
    let claims = match AuthUtils::verify_jwt(token, &jwt_secret) {
        Ok(claims) => claims,
        Err(_) => return Err(StatusCode::UNAUTHORIZED),
    };

    // Parse user ID
    let user_id = match Uuid::parse_str(&claims.sub) {
        Ok(id) => id,
        Err(_) => return Err(StatusCode::UNAUTHORIZED),
    };

    // Parse organization ID if present
    let organization_id = claims.org_id
        .and_then(|id| Uuid::parse_str(&id).ok());

    // Verify user exists
    match db.get_user_by_id(user_id).await {
        Ok(Some(_)) => {},
        _ => return Err(StatusCode::UNAUTHORIZED),
    }

    // Create auth context
    let auth_context = AuthContext {
        user_id,
        email: claims.email,
        organization_id,
        role: claims.role,
    };

    // Add auth context to request extensions
    request.extensions_mut().insert(auth_context);

    Ok(next.run(request).await)
}

// Auth handlers
async fn auth_signup(
    State(db): State<AppState>,
    Json(request): Json<SignupRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    // Check if user already exists
    if db.get_user_by_email(&request.email).await.unwrap_or(None).is_some() {
        return Err(StatusCode::CONFLICT);
    }

    // Hash password
    let password_hash = match AuthUtils::hash_password(&request.password) {
        Ok(hash) => hash,
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };

    // Create user
    let user = User {
        id: Uuid::new_v4(),
        email: request.email.clone(),
        name: request.name.clone(),
        password_hash: Some(password_hash),
        external_provider_id: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    if let Err(_) = db.create_user(&user).await {
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }

    // Create organization if provided
    let organization = if let Some(org_name) = request.organization_name {
        let org = Organization {
            id: Uuid::new_v4(),
            name: org_name,
            stripe_customer_id: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        if let Err(_) = db.create_organization(&org).await {
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }

        // Add user as owner
        let member = OrganizationMember {
            id: Uuid::new_v4(),
            organization_id: org.id,
            user_id: user.id,
            role: MemberRole::Owner,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        if let Err(_) = db.create_organization_member(&member).await {
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }

        Some(OrganizationInfo {
            id: org.id,
            name: org.name,
            role: MemberRole::Owner,
        })
    } else {
        None
    };

    // Generate JWT
    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "default_secret_key".to_string());
    let token = match AuthUtils::generate_jwt(
        user.id,
        &user.email,
        organization.as_ref().map(|org| org.id),
        organization.as_ref().map(|org| org.role.clone()),
        &jwt_secret,
    ) {
        Ok(token) => token,
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };

    Ok(Json(AuthResponse {
        token,
        user: UserInfo {
            id: user.id,
            email: user.email,
            name: user.name,
        },
        organization,
    }))
}

async fn auth_login(
    State(db): State<AppState>,
    Json(request): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    // Get user by email
    let user = match db.get_user_by_email(&request.email).await {
        Ok(Some(user)) => user,
        _ => return Err(StatusCode::UNAUTHORIZED),
    };

    // Verify password
    let password_hash = match &user.password_hash {
        Some(hash) => hash,
        None => return Err(StatusCode::UNAUTHORIZED), // User without password (OAuth only)
    };

    if !AuthUtils::verify_password(&request.password, password_hash).unwrap_or(false) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    // Get user's organizations
    let user_orgs = match db.get_user_organizations(user.id).await {
        Ok(orgs) => orgs,
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };

    // Determine current organization
    let current_org = if let Some(requested_org_id) = request.organization_id {
        // Find the requested organization among user's organizations
        user_orgs.iter()
            .find(|(org, _)| org.id == requested_org_id)
            .map(|(org, role)| OrganizationInfo {
                id: org.id,
                name: org.name.clone(),
                role: role.clone(),
            })
    } else {
        // Use the first organization (if any)
        user_orgs.first()
            .map(|(org, role)| OrganizationInfo {
                id: org.id,
                name: org.name.clone(),
                role: role.clone(),
            })
    };

    // Generate JWT
    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "default_secret_key".to_string());
    let token = match AuthUtils::generate_jwt(
        user.id,
        &user.email,
        current_org.as_ref().map(|org| org.id),
        current_org.as_ref().map(|org| org.role.clone()),
        &jwt_secret,
    ) {
        Ok(token) => token,
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };

    Ok(Json(AuthResponse {
        token,
        user: UserInfo {
            id: user.id,
            email: user.email,
            name: user.name,
        },
        organization: current_org,
    }))
}

async fn auth_me(auth: AuthContext) -> Result<Json<Value>, StatusCode> {
    Ok(Json(json!({
        "user_id": auth.user_id,
        "email": auth.email,
        "organization_id": auth.organization_id,
        "role": auth.role
    })))
}

async fn auth_logout() -> Json<Value> {
    // In a stateless JWT system, logout is typically handled client-side
    // by simply removing the token. Here we just return success.
    Json(json!({ "message": "Logged out successfully" }))
}

async fn auth_switch_organization(
    Path(org_id): Path<Uuid>,
    auth: AuthContext,
    State(db): State<AppState>,
) -> Result<Json<AuthResponse>, StatusCode> {
    // Get user
    let user = match db.get_user_by_id(auth.user_id).await {
        Ok(Some(user)) => user,
        _ => return Err(StatusCode::UNAUTHORIZED),
    };

    // Verify user is member of the organization
    let member = match db.get_organization_member(org_id, auth.user_id).await {
        Ok(Some(member)) => member,
        _ => return Err(StatusCode::FORBIDDEN),
    };

    // Get organization info
    let org = match db.get_organization_by_id(org_id).await {
        Ok(Some(org)) => org,
        _ => return Err(StatusCode::NOT_FOUND),
    };

    // Generate new JWT with the new organization
    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "default_secret_key".to_string());
    let token = match AuthUtils::generate_jwt(
        user.id,
        &user.email,
        Some(org.id),
        Some(member.role.clone()),
        &jwt_secret,
    ) {
        Ok(token) => token,
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };

    Ok(Json(AuthResponse {
        token,
        user: UserInfo {
            id: user.id,
            email: user.email,
            name: user.name,
        },
        organization: Some(OrganizationInfo {
            id: org.id,
            name: org.name,
            role: member.role,
        }),
    }))
}

// Organization management handlers
async fn list_user_organizations(_auth: AuthContext) -> Result<Json<Vec<OrganizationInfo>>, StatusCode> {
    // This would normally be implemented with a proper database query
    // For now, return empty list as a placeholder
    Ok(Json(vec![]))
}

async fn create_organization(
    auth: AuthContext,
    State(db): State<AppState>,
    Json(org_request): Json<Value>,
) -> Result<Json<OrganizationInfo>, StatusCode> {
    let org_name = org_request.get("name")
        .and_then(|v| v.as_str())
        .ok_or(StatusCode::BAD_REQUEST)?;

    // Create organization
    let org = Organization {
        id: Uuid::new_v4(),
        name: org_name.to_string(),
        stripe_customer_id: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    if let Err(_) = db.create_organization(&org).await {
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }

    // Add user as owner
    let member = OrganizationMember {
        id: Uuid::new_v4(),
        organization_id: org.id,
        user_id: auth.user_id,
        role: MemberRole::Owner,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    if let Err(_) = db.create_organization_member(&member).await {
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }

    Ok(Json(OrganizationInfo {
        id: org.id,
        name: org.name,
        role: MemberRole::Owner,
    }))
}

async fn list_organization_members(
    Path(org_id): Path<Uuid>,
    auth: AuthContext,
    State(db): State<AppState>,
) -> Result<Json<Vec<Value>>, StatusCode> {
    // Verify user is member of the organization
    if db.get_organization_member(org_id, auth.user_id).await.unwrap_or(None).is_none() {
        return Err(StatusCode::FORBIDDEN);
    }

    // Get organization members
    let members = match db.get_organization_members(org_id).await {
        Ok(members) => members,
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };

    // Convert to response format (would include user details in real implementation)
    let response: Vec<Value> = members.iter().map(|member| {
        json!({
            "user_id": member.user_id,
            "role": member.role,
            "created_at": member.created_at
        })
    }).collect();

    Ok(Json(response))
}

async fn invite_member(
    Path(org_id): Path<Uuid>,
    auth: AuthContext,
    State(db): State<AppState>,
    Json(invite_request): Json<InviteMemberRequest>,
) -> Result<Json<Value>, StatusCode> {
    // Verify user is owner of the organization
    let _member = match db.get_organization_member(org_id, auth.user_id).await {
        Ok(Some(member)) if member.role == MemberRole::Owner => member,
        _ => return Err(StatusCode::FORBIDDEN),
    };

    // Find user by email
    let user = match db.get_user_by_email(&invite_request.email).await {
        Ok(Some(user)) => user,
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };

    // Check if user is already a member
    if db.get_organization_member(org_id, user.id).await.unwrap_or(None).is_some() {
        return Err(StatusCode::CONFLICT);
    }

    // Add user as member
    let new_member = OrganizationMember {
        id: Uuid::new_v4(),
        organization_id: org_id,
        user_id: user.id,
        role: invite_request.role,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    if let Err(_) = db.create_organization_member(&new_member).await {
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }

    Ok(Json(json!({
        "message": "Member invited successfully",
        "user_id": user.id,
        "role": new_member.role
    })))
}

async fn remove_member(
    Path((org_id, user_id)): Path<(Uuid, Uuid)>,
    auth: AuthContext,
    State(db): State<AppState>,
) -> Result<StatusCode, StatusCode> {
    // Verify user is owner of the organization
    let _member = match db.get_organization_member(org_id, auth.user_id).await {
        Ok(Some(member)) if member.role == MemberRole::Owner => member,
        _ => return Err(StatusCode::FORBIDDEN),
    };

    // Cannot remove themselves
    if auth.user_id == user_id {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Remove member
    if let Err(_) = db.remove_organization_member(org_id, user_id).await {
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }

    Ok(StatusCode::NO_CONTENT)
}

// Test Definition handlers
async fn list_test_definitions(
    auth: AuthContext,
    State(db): State<AppState>,
) -> Result<Json<Vec<SaasTestDefinition>>, StatusCode> {
    match db.list_test_definitions(Some(auth.user_id), auth.organization_id).await {
        Ok(definitions) => Ok(Json(definitions)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn create_test_definition(
    auth: AuthContext,
    State(db): State<AppState>,
    Json(mut definition): Json<SaasTestDefinition>,
) -> Result<Json<SaasTestDefinition>, StatusCode> {
    definition.id = Uuid::new_v4();
    definition.created_at = Utc::now();
    definition.updated_at = Utc::now();
    definition.user_id = Some(auth.user_id);
    definition.organization_id = auth.organization_id;

    match db.create_test_definition(&definition).await {
        Ok(_) => Ok(Json(definition)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn get_test_definition(
    Path(id): Path<Uuid>,
    auth: AuthContext,
    State(db): State<AppState>,
) -> Result<Json<SaasTestDefinition>, StatusCode> {
    match db.get_test_definition(id).await {
        Ok(Some(definition)) => {
            // Check if user has access to this definition
            if definition.user_id == Some(auth.user_id) 
                || definition.organization_id == auth.organization_id 
                || definition.is_public {
                Ok(Json(definition))
            } else {
                Err(StatusCode::FORBIDDEN)
            }
        },
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn update_test_definition(
    Path(id): Path<Uuid>,
    auth: AuthContext,
    State(db): State<AppState>,
    Json(mut definition): Json<SaasTestDefinition>,
) -> Result<Json<SaasTestDefinition>, StatusCode> {
    // Get existing definition to check ownership
    let existing = match db.get_test_definition(id).await {
        Ok(Some(def)) => def,
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };

    // Check if user can update this definition
    if existing.user_id != Some(auth.user_id) && existing.organization_id != auth.organization_id {
        return Err(StatusCode::FORBIDDEN);
    }

    definition.id = id;
    definition.updated_at = Utc::now();
    // Preserve original ownership
    definition.user_id = existing.user_id;
    definition.organization_id = existing.organization_id;

    // For now, just return the updated definition
    // In a real implementation, you'd update in the database
    Ok(Json(definition))
}

async fn delete_test_definition(
    Path(id): Path<Uuid>,
    auth: AuthContext,
    State(db): State<AppState>,
) -> Result<StatusCode, StatusCode> {
    // Get existing definition to check ownership
    let existing = match db.get_test_definition(id).await {
        Ok(Some(def)) => def,
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };

    // Check if user can delete this definition
    if existing.user_id != Some(auth.user_id) && existing.organization_id != auth.organization_id {
        return Err(StatusCode::FORBIDDEN);
    }

    match db.delete_test_definition(id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

// Test Run handlers
async fn list_test_runs(
    auth: AuthContext,
    State(db): State<AppState>,
) -> Result<Json<Vec<SaasTestRun>>, StatusCode> {
    match db.list_test_runs(Some(auth.user_id), auth.organization_id).await {
        Ok(runs) => Ok(Json(runs)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn create_test_run(
    auth: AuthContext,
    State(db): State<AppState>,
    Json(mut run): Json<SaasTestRun>,
) -> Result<Json<SaasTestRun>, StatusCode> {
    run.id = Uuid::new_v4();
    run.created_at = Utc::now();
    run.updated_at = Utc::now();
    run.user_id = Some(auth.user_id);
    run.organization_id = auth.organization_id;

    match db.create_test_run(&run).await {
        Ok(_) => Ok(Json(run)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn get_test_run(
    Path(id): Path<Uuid>,
    auth: AuthContext,
    State(db): State<AppState>,
) -> Result<Json<Value>, StatusCode> {
    match db.get_test_run(id).await {
        Ok(Some(run)) => {
            // Check if user has access to this run
            if run.user_id == Some(auth.user_id) || run.organization_id == auth.organization_id {
                Ok(Json(serde_json::to_value(run).unwrap()))
            } else {
                Err(StatusCode::FORBIDDEN)
            }
        },
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
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