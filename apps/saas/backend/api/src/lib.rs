use axum::{
    body::Bytes,
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    routing::{delete, get, patch, post},
    Json, Router,
};
use chrono::Utc;
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::Sha256;
use sparktest_saas_core::{
    deliver_run_event, schedule_next_run_at, Agent, AgentToken, AgentTokenCreated, AgentWithLabels,
    Artifact, AuditLog, Database, Environment, Executor, FlakyTest, OrgSubscription, Organization,
    Plan, Profile, Project, ProjectMember, RetentionPolicy, RoutingRule, SaasTestDefinition,
    SaasTestRun, Schedule, SupabaseJwtVerifier, TestSuite, Webhook, WebhookDelivery,
};
use std::sync::{Arc, OnceLock};
use stripe::{
    CheckoutSession, CheckoutSessionMode, Client, CreateCheckoutSession,
    CreateCheckoutSessionLineItems,
};
use tower_http::cors::CorsLayer;
use uuid::Uuid;

pub type AppState = Arc<Database>;
type HmacSha256 = Hmac<Sha256>;

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

#[derive(Debug, Serialize)]
struct BillingStatus {
    plan_slug: String,
    plan_name: String,
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

#[derive(Debug, Deserialize)]
struct ProfileRequest {
    email: String,
    name: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ProjectRequest {
    name: String,
}

#[derive(Debug, Deserialize)]
struct AgentTokenRequest {
    name: String,
}

#[derive(Debug, Deserialize)]
struct AgentCheckInRequest {
    name: String,
    version: Option<String>,
    status: Option<String>,
}

#[derive(Debug, Deserialize)]
struct RunStatusRequest {
    status: String,
    result: Option<Value>,
    error: Option<String>,
}
#[derive(Debug, Deserialize)]
struct TriggerRunRequest {
    definition_id: Uuid,
}

#[derive(Debug, Serialize)]
struct QueueResponse {
    run: Option<SaasTestRun>,
    definition: Option<SaasTestDefinition>,
    executor: Option<Executor>,
}

#[derive(Debug, Clone)]
struct HumanContext {
    user_id: Option<Uuid>,
    email: Option<String>,
    project_id: Uuid,
}

fn supabase_jwt_verifier() -> &'static SupabaseJwtVerifier {
    static VERIFIER: OnceLock<SupabaseJwtVerifier> = OnceLock::new();
    VERIFIER.get_or_init(|| {
        let supabase_url = std::env::var("SUPABASE_URL")
            .expect("SUPABASE_URL must be set to verify Supabase auth JWTs");
        let jwt_secret = std::env::var("SUPABASE_JWT_SECRET").ok();
        SupabaseJwtVerifier::with_jwt_secret(&supabase_url, jwt_secret)
    })
}

pub fn create_app(database: Database) -> Router {
    let state = Arc::new(database);

    Router::new()
        .route("/api/health", get(health_check))
        .route("/api/profile", post(upsert_profile))
        .route("/api/projects", get(list_projects).post(create_project))
        .route("/api/projects/:id/members", get(list_project_members))
        .route(
            "/api/test-definitions",
            get(list_test_definitions).post(create_test_definition),
        )
        .route(
            "/api/test-definitions/:id",
            get(get_test_definition)
                .put(update_test_definition)
                .delete(delete_test_definition),
        )
        .route("/api/test-runs", get(list_test_runs).post(create_test_run))
        .route("/api/test-runs/:id", get(get_test_run).put(update_test_run))
        .route("/api/executors", get(list_executors).post(create_executor))
        .route(
            "/api/executors/:id",
            get(get_executor)
                .put(update_executor)
                .delete(delete_executor),
        )
        .route(
            "/api/test-suites",
            get(list_test_suites).post(create_test_suite),
        )
        .route(
            "/api/test-suites/:id",
            get(get_test_suite)
                .put(update_test_suite)
                .delete(delete_test_suite),
        )
        .route(
            "/api/agent-tokens",
            get(list_agent_tokens).post(create_agent_token),
        )
        .route("/api/agent-tokens/:id", delete(revoke_agent_token))
        .route("/api/agents", get(list_agents))
        .route("/api/agent/check-in", post(agent_check_in))
        .route("/api/agent/next-run", post(agent_next_run))
        .route("/api/agent/runs/:id/status", post(agent_update_run_status))
        .route("/api/agent/trigger-run", post(agent_trigger_run))
        .route(
            "/api/ci/schedules",
            get(list_schedules).post(create_schedule),
        )
        .route(
            "/api/ci/schedules/:id",
            patch(update_schedule).delete(delete_schedule),
        )
        .route("/api/ci/webhooks", get(list_webhooks).post(create_webhook))
        .route(
            "/api/ci/webhooks/:id",
            patch(update_webhook).delete(delete_webhook),
        )
        .route(
            "/api/ci/webhooks/:id/deliveries",
            get(list_webhook_deliveries),
        )
        .route(
            "/api/routing/environments",
            get(list_environments).post(create_environment),
        )
        .route("/api/routing/environments/:id", delete(delete_environment))
        .route(
            "/api/routing/rules",
            get(list_routing_rules).post(create_routing_rule),
        )
        .route(
            "/api/routing/rules/:id",
            patch(update_routing_rule).delete(delete_routing_rule),
        )
        .route("/api/routing/agents", get(list_agents_with_labels))
        .route(
            "/api/agents/:id/labels",
            post(set_agent_label).delete(delete_agent_label),
        )
        .route("/api/agents/:id/environment", patch(set_agent_environment))
        .route("/api/security/audit", get(list_audit_logs))
        .route(
            "/api/insights/retention",
            get(list_retention_policies).put(upsert_retention_policy),
        )
        .route("/api/insights/artifacts", get(list_artifacts))
        .route("/api/insights/artifacts/:id", delete(delete_artifact))
        .route("/api/insights/flaky", get(list_flaky_tests))
        .route("/api/insights/flaky/:id", patch(update_flaky_test_status))
        .route("/api/billing/plans", get(list_plans))
        .route("/api/billing/status", get(billing_status))
        .route("/api/billing/checkout", post(create_checkout_session))
        .route("/api/billing/webhook", post(handle_webhook))
        .layer(CorsLayer::permissive())
        .with_state(state)
}

async fn health_check() -> Json<Value> {
    Json(json!({ "status": "ok", "timestamp": Utc::now() }))
}

async fn human_context(headers: &HeaderMap, db: &Database) -> HumanContext {
    let jwt_claims = verify_supabase_jwt(headers).await;
    let user_id = jwt_claims
        .as_ref()
        .and_then(|claims| Uuid::parse_str(&claims.sub).ok());
    let requested_project_id = headers
        .get("x-project-id")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| Uuid::parse_str(value).ok());
    let project_id = match requested_project_id {
        Some(project_id) => project_id,
        None => match user_id {
            Some(user_id) => db
                .project_id_for_profile(user_id)
                .await
                .ok()
                .flatten()
                .unwrap_or_else(|| db.default_project_id()),
            None => db.default_project_id(),
        },
    };

    HumanContext {
        user_id,
        email: jwt_claims.and_then(|claims| claims.email),
        project_id,
    }
}

// Verifies the JWT's signature against Supabase's published JWKS (see
// sparktest_saas_core::SupabaseJwtVerifier — Supabase's newer projects sign
// with an asymmetric key, not a shared secret).
async fn verify_supabase_jwt(headers: &HeaderMap) -> Option<sparktest_saas_core::SupabaseClaims> {
    let token = bearer_token(headers)?;
    supabase_jwt_verifier().verify(&token).await
}

async fn ensure_project_access(db: &Database, ctx: &HumanContext) -> Result<(), StatusCode> {
    match db.has_project_access(ctx.project_id, ctx.user_id).await {
        Ok(true) => Ok(()),
        Ok(false) => Err(StatusCode::FORBIDDEN),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

fn require_user(ctx: &HumanContext) -> Result<Uuid, StatusCode> {
    ctx.user_id.ok_or(StatusCode::UNAUTHORIZED)
}

fn bearer_token(headers: &HeaderMap) -> Option<String> {
    headers
        .get("authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "))
        .map(ToOwned::to_owned)
}

async fn authenticate_agent(headers: &HeaderMap, db: &Database) -> Result<AgentToken, StatusCode> {
    let token = bearer_token(headers).ok_or(StatusCode::UNAUTHORIZED)?;
    db.authenticate_agent_token(&token)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::UNAUTHORIZED)
}

async fn upsert_profile(
    State(db): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<ProfileRequest>,
) -> Result<Json<Profile>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    let user_id = require_user(&ctx)?;
    let email = ctx.email.unwrap_or(request.email);
    db.ensure_profile(user_id, email, request.name)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn list_projects(
    State(db): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Project>>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    let user_id = require_user(&ctx)?;
    db.list_projects(Some(user_id))
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn create_project(
    State(db): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<ProjectRequest>,
) -> Result<Json<Project>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    let user_id = require_user(&ctx)?;
    enforce_project_limit(&db).await?;
    let now = Utc::now();
    let project = Project {
        id: Uuid::nil(),
        name: request.name,
        slug: String::new(),
        created_at: now,
        updated_at: now,
    };
    db.create_project(project, Some(user_id))
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn list_project_members(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(project_id): Path<Uuid>,
) -> Result<Json<Vec<ProjectMember>>, StatusCode> {
    let mut ctx = human_context(&headers, &db).await;
    ctx.project_id = project_id;
    ensure_project_access(&db, &ctx).await?;
    db.list_project_members(project_id)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn list_test_definitions(
    State(db): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<SaasTestDefinition>>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    db.list_test_definitions(Some(ctx.project_id), ctx.user_id)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn create_test_definition(
    State(db): State<AppState>,
    headers: HeaderMap,
    Json(mut definition): Json<SaasTestDefinition>,
) -> Result<Json<SaasTestDefinition>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    ensure_executor_access(&db, ctx.project_id, definition.executor_id).await?;
    definition.id = Uuid::new_v4();
    definition.project_id = ctx.project_id;
    definition.created_at = Utc::now();
    definition.updated_at = Utc::now();
    db.create_test_definition(&definition)
        .await
        .map(|_| Json(definition))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn get_test_definition(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<SaasTestDefinition>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    match db.get_test_definition(id).await {
        Ok(Some(definition)) if definition.project_id == ctx.project_id => Ok(Json(definition)),
        Ok(Some(_)) => Err(StatusCode::FORBIDDEN),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn update_test_definition(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(mut definition): Json<SaasTestDefinition>,
) -> Result<Json<SaasTestDefinition>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    ensure_executor_access(&db, ctx.project_id, definition.executor_id).await?;
    definition.id = id;
    definition.project_id = ctx.project_id;
    definition.updated_at = Utc::now();
    db.update_test_definition(&definition)
        .await
        .map(|_| Json(definition))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn delete_test_definition(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    db.delete_test_definition(id)
        .await
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn list_test_runs(
    State(db): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<SaasTestRun>>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    db.list_test_runs(Some(ctx.project_id), ctx.user_id)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn create_test_run(
    State(db): State<AppState>,
    headers: HeaderMap,
    Json(mut run): Json<SaasTestRun>,
) -> Result<Json<SaasTestRun>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    ensure_executor_access(&db, ctx.project_id, run.executor_id).await?;
    if let Some(definition_id) = run.definition_id {
        let definition = db
            .get_test_definition(definition_id)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        if definition
            .as_ref()
            .is_none_or(|definition| definition.project_id != ctx.project_id)
        {
            return Err(StatusCode::FORBIDDEN);
        }
        if run.executor_id.is_none() {
            run.executor_id = definition.and_then(|definition| definition.executor_id);
        }
    }
    run.id = Uuid::new_v4();
    run.project_id = ctx.project_id;
    run.status = if run.status.is_empty() {
        "queued".to_string()
    } else {
        run.status
    };
    run.queued_at = Utc::now();
    run.created_at = Utc::now();
    run.updated_at = Utc::now();
    db.create_test_run(&run)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    deliver_run_event(&db, run.project_id, "queued", &run).await;

    let _ = db
        .record_audit_log(
            run.project_id,
            ctx.user_id,
            ctx.email.as_deref(),
            "run.created",
            "test_run",
            Some(&run.id.to_string()),
            json!({ "definition_id": run.definition_id, "suite_id": run.suite_id }),
        )
        .await;

    Ok(Json(run))
}

async fn get_test_run(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<SaasTestRun>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    match db.get_test_run(id).await {
        Ok(Some(run)) if run.project_id == ctx.project_id => Ok(Json(run)),
        Ok(Some(_)) => Err(StatusCode::FORBIDDEN),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn update_test_run(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(mut run): Json<SaasTestRun>,
) -> Result<Json<SaasTestRun>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    run.id = id;
    run.project_id = ctx.project_id;
    run.updated_at = Utc::now();
    db.update_test_run(&run)
        .await
        .map(|_| Json(run))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn list_executors(
    State(db): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Executor>>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    db.list_executors(ctx.project_id)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn create_executor(
    State(db): State<AppState>,
    headers: HeaderMap,
    Json(mut executor): Json<Executor>,
) -> Result<Json<Executor>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    executor.id = Uuid::new_v4();
    executor.project_id = ctx.project_id;
    executor.created_at = Utc::now();
    executor.updated_at = Utc::now();
    db.create_executor(executor)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn get_executor(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<Executor>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    match db.get_executor(id).await {
        Ok(Some(executor)) if executor.project_id == ctx.project_id => Ok(Json(executor)),
        Ok(Some(_)) => Err(StatusCode::FORBIDDEN),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn update_executor(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(mut executor): Json<Executor>,
) -> Result<Json<Executor>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    executor.id = id;
    executor.project_id = ctx.project_id;
    executor.updated_at = Utc::now();
    db.update_executor(executor)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn delete_executor(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    match db.get_executor(id).await {
        Ok(Some(executor)) if executor.project_id == ctx.project_id => {}
        Ok(Some(_)) => return Err(StatusCode::FORBIDDEN),
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
    db.delete_executor(id)
        .await
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn ensure_executor_access(
    db: &Database,
    project_id: Uuid,
    executor_id: Option<Uuid>,
) -> Result<(), StatusCode> {
    let Some(executor_id) = executor_id else {
        return Ok(());
    };
    match db.get_executor(executor_id).await {
        Ok(Some(executor)) if executor.project_id == project_id => Ok(()),
        Ok(Some(_)) => Err(StatusCode::FORBIDDEN),
        Ok(None) => Err(StatusCode::BAD_REQUEST),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn list_test_suites(
    State(db): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<TestSuite>>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    db.list_test_suites(ctx.project_id)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn create_test_suite(
    State(db): State<AppState>,
    headers: HeaderMap,
    Json(mut suite): Json<TestSuite>,
) -> Result<Json<TestSuite>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    suite.id = Uuid::new_v4();
    suite.project_id = ctx.project_id;
    suite.created_at = Utc::now();
    suite.updated_at = Utc::now();
    db.create_test_suite(suite)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn get_test_suite(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<TestSuite>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    match db.get_test_suite(id).await {
        Ok(Some(suite)) if suite.project_id == ctx.project_id => Ok(Json(suite)),
        Ok(Some(_)) => Err(StatusCode::FORBIDDEN),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn update_test_suite(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(mut suite): Json<TestSuite>,
) -> Result<Json<TestSuite>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    suite.id = id;
    suite.project_id = ctx.project_id;
    suite.updated_at = Utc::now();
    db.update_test_suite(suite)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn delete_test_suite(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    db.delete_test_suite(id)
        .await
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn list_agent_tokens(
    State(db): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<AgentToken>>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    db.list_agent_tokens(ctx.project_id)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn create_agent_token(
    State(db): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<AgentTokenRequest>,
) -> Result<Json<AgentTokenCreated>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    enforce_agent_limit(&db, ctx.project_id).await?;
    let token_name = request.name.clone();
    let token = db
        .create_agent_token(ctx.project_id, request.name)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let _ = db
        .record_audit_log(
            ctx.project_id,
            ctx.user_id,
            ctx.email.as_deref(),
            "agent_token.created",
            "agent_token",
            Some(&token.id.to_string()),
            json!({ "name": token_name }),
        )
        .await;

    Ok(Json(token))
}

async fn enforce_project_limit(db: &Database) -> Result<(), StatusCode> {
    let count = db
        .count_projects()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    if count >= 1 && current_plan_slug() == "free" {
        return Err(StatusCode::PAYMENT_REQUIRED);
    }
    Ok(())
}

async fn enforce_agent_limit(db: &Database, project_id: Uuid) -> Result<(), StatusCode> {
    let count = db
        .count_active_agent_tokens(project_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let max_tokens = if current_plan_slug() == "pro" { 10 } else { 1 };
    if count >= max_tokens {
        return Err(StatusCode::PAYMENT_REQUIRED);
    }
    Ok(())
}

fn current_plan_slug() -> String {
    std::env::var("SPARKTEST_PLAN").unwrap_or_else(|_| "free".to_string())
}

async fn revoke_agent_token(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;

    let _ = db
        .record_audit_log(
            ctx.project_id,
            ctx.user_id,
            ctx.email.as_deref(),
            "agent_token.revoked",
            "agent_token",
            Some(&id.to_string()),
            json!({}),
        )
        .await;

    db.revoke_agent_token(ctx.project_id, id)
        .await
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn list_agents(
    State(db): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Agent>>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    db.list_agents(ctx.project_id)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn list_agents_with_labels(
    State(db): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<AgentWithLabels>>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    db.list_agents_with_labels(ctx.project_id)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

#[derive(Debug, Deserialize)]
struct SetAgentLabelRequest {
    key: String,
    value: String,
}

#[derive(Debug, Deserialize)]
struct DeleteAgentLabelRequest {
    key: String,
}

// Labels are set/removed "via settings" (issue #77's own scope text) rather
// than at check-in, since AgentCheckInRequest is the agent's own self-report
// and label assignment is an operator/dashboard action.
async fn set_agent_label(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(request): Json<SetAgentLabelRequest>,
) -> Result<Json<Vec<AgentLabelResponse>>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;

    match db.get_agent(id).await {
        Ok(Some(agent)) if agent.project_id == ctx.project_id => {}
        Ok(Some(_)) => return Err(StatusCode::FORBIDDEN),
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    db.set_agent_label(id, &request.key, &request.value)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    db.list_agent_labels(id)
        .await
        .map(|labels| Json(labels.into_iter().map(Into::into).collect()))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn delete_agent_label(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(request): Json<DeleteAgentLabelRequest>,
) -> Result<StatusCode, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;

    match db.get_agent(id).await {
        Ok(Some(agent)) if agent.project_id == ctx.project_id => {}
        Ok(Some(_)) => return Err(StatusCode::FORBIDDEN),
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    db.delete_agent_label(id, &request.key)
        .await
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

#[derive(Debug, Deserialize)]
struct SetAgentEnvironmentRequest {
    environment_id: Option<Uuid>,
}

async fn set_agent_environment(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(request): Json<SetAgentEnvironmentRequest>,
) -> Result<StatusCode, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;

    match db.get_agent(id).await {
        Ok(Some(agent)) if agent.project_id == ctx.project_id => {}
        Ok(Some(_)) => return Err(StatusCode::FORBIDDEN),
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    db.set_agent_environment(id, request.environment_id)
        .await
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

#[derive(Debug, Serialize)]
struct AgentLabelResponse {
    key: String,
    value: String,
}

impl From<sparktest_saas_core::AgentLabel> for AgentLabelResponse {
    fn from(label: sparktest_saas_core::AgentLabel) -> Self {
        Self {
            key: label.key,
            value: label.value,
        }
    }
}

#[derive(Debug, Deserialize)]
struct CreateEnvironmentRequest {
    name: String,
    slug: String,
}

async fn list_environments(
    State(db): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Environment>>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    db.list_environments(ctx.project_id)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn create_environment(
    State(db): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<CreateEnvironmentRequest>,
) -> Result<Json<Environment>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;

    let now = Utc::now();
    let environment = Environment {
        id: Uuid::new_v4(),
        project_id: ctx.project_id,
        name: request.name,
        slug: request.slug,
        description: None,
        color: "#6366f1".to_string(),
        is_default: false,
        created_at: now,
        updated_at: now,
    };

    db.create_environment(&environment)
        .await
        .map(|_| Json(environment))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn delete_environment(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;

    match db.get_environment(id).await {
        Ok(Some(env)) if env.project_id == ctx.project_id => {}
        Ok(Some(_)) => return Err(StatusCode::FORBIDDEN),
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    db.delete_environment(id)
        .await
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

#[derive(Debug, Deserialize)]
struct CreateRoutingRuleRequest {
    name: String,
    description: Option<String>,
    match_labels: Value,
    target_environment_id: Option<Uuid>,
    target_agent_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
struct UpdateRoutingRuleRequest {
    enabled: bool,
}

async fn list_routing_rules(
    State(db): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<RoutingRule>>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    db.list_routing_rules(ctx.project_id)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn create_routing_rule(
    State(db): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<CreateRoutingRuleRequest>,
) -> Result<Json<RoutingRule>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;

    let now = Utc::now();
    let rule = RoutingRule {
        id: Uuid::new_v4(),
        project_id: ctx.project_id,
        name: request.name,
        description: request.description,
        match_labels: request.match_labels,
        target_environment_id: request.target_environment_id,
        target_agent_id: request.target_agent_id,
        priority: 0,
        enabled: true,
        created_at: now,
        updated_at: now,
    };

    db.create_routing_rule(&rule)
        .await
        .map(|_| Json(rule))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn update_routing_rule(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateRoutingRuleRequest>,
) -> Result<StatusCode, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;

    match db.get_routing_rule(id).await {
        Ok(Some(rule)) if rule.project_id == ctx.project_id => {}
        Ok(Some(_)) => return Err(StatusCode::FORBIDDEN),
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    db.set_routing_rule_enabled(id, request.enabled)
        .await
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn delete_routing_rule(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;

    match db.get_routing_rule(id).await {
        Ok(Some(rule)) if rule.project_id == ctx.project_id => {}
        Ok(Some(_)) => return Err(StatusCode::FORBIDDEN),
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    db.delete_routing_rule(id)
        .await
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn agent_check_in(
    State(db): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<AgentCheckInRequest>,
) -> Result<Json<Agent>, StatusCode> {
    let token = authenticate_agent(&headers, &db).await?;
    db.check_in_agent(
        &token,
        request.name,
        request.version,
        request.status.unwrap_or_else(|| "online".to_string()),
    )
    .await
    .map(Json)
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn agent_next_run(
    State(db): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<AgentCheckInRequest>,
) -> Result<Json<QueueResponse>, StatusCode> {
    let token = authenticate_agent(&headers, &db).await?;
    let agent = db
        .check_in_agent(
            &token,
            request.name,
            request.version,
            request.status.unwrap_or_else(|| "online".to_string()),
        )
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let run = db
        .claim_next_run(token.project_id, agent.id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let definition = match run.as_ref().and_then(|run| run.definition_id) {
        Some(definition_id) => db
            .get_test_definition(definition_id)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?,
        None => None,
    };
    let executor = match run.as_ref().and_then(|run| run.executor_id).or_else(|| {
        definition
            .as_ref()
            .and_then(|definition| definition.executor_id)
    }) {
        Some(executor_id) => db
            .get_executor(executor_id)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?,
        None => None,
    };
    Ok(Json(QueueResponse {
        run,
        definition,
        executor,
    }))
}

async fn agent_update_run_status(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(request): Json<RunStatusRequest>,
) -> Result<Json<SaasTestRun>, StatusCode> {
    let token = authenticate_agent(&headers, &db).await?;
    let mut run = db
        .get_test_run(id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;
    if run.project_id != token.project_id {
        return Err(StatusCode::FORBIDDEN);
    }
    // A response can be lost after persistence. Replayed result uploads should
    // not change completion timestamps or redeliver the same webhook.
    if run.status == request.status && run.result == request.result && run.error == request.error {
        return Ok(Json(run));
    }
    run.status = request.status;
    run.result = request.result;
    run.error = request.error;
    if matches!(
        run.status.as_str(),
        "passed" | "failed" | "cancelled" | "error" | "completed"
    ) {
        run.finished_at = Some(Utc::now());
    }
    run.updated_at = Utc::now();
    db.update_test_run(&run)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Fire-and-record: webhook delivery must not block or fail the agent's
    // status-report request, which already succeeded by this point.
    deliver_run_event(&db, run.project_id, &run.status, &run).await;

    Ok(Json(run))
}

async fn agent_trigger_run(
    State(db): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<TriggerRunRequest>,
) -> Result<Json<SaasTestRun>, StatusCode> {
    let token = authenticate_agent(&headers, &db).await?;
    let definition = db
        .get_test_definition(request.definition_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .filter(|definition| definition.project_id == token.project_id)
        .ok_or(StatusCode::FORBIDDEN)?;
    let now = Utc::now();
    let run = SaasTestRun {
        id: Uuid::new_v4(),
        project_id: token.project_id,
        definition_id: Some(request.definition_id),
        suite_id: None,
        executor_id: definition.executor_id,
        agent_id: None,
        status: "queued".to_string(),
        result: None,
        error: None,
        queued_at: now,
        started_at: None,
        finished_at: None,
        created_at: now,
        updated_at: now,
        target_environment_id: None,
    };
    db.create_test_run(&run)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    deliver_run_event(&db, run.project_id, "queued", &run).await;

    Ok(Json(run))
}

#[derive(Debug, Deserialize)]
struct CreateScheduleRequest {
    name: String,
    definition_id: Option<Uuid>,
    suite_id: Option<Uuid>,
    cron_expression: String,
    timezone: Option<String>,
}

#[derive(Debug, Deserialize)]
struct UpdateScheduleRequest {
    enabled: bool,
}

async fn list_schedules(
    State(db): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Schedule>>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    db.list_schedules(ctx.project_id)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn create_schedule(
    State(db): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<CreateScheduleRequest>,
) -> Result<Json<Schedule>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;

    if request.definition_id.is_none() && request.suite_id.is_none() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let timezone = request.timezone.unwrap_or_else(|| "UTC".to_string());
    let now = Utc::now();
    let next_run_at = schedule_next_run_at(&request.cron_expression, &timezone, now)
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    let schedule = Schedule {
        id: Uuid::new_v4(),
        project_id: ctx.project_id,
        name: request.name,
        definition_id: request.definition_id,
        suite_id: request.suite_id,
        cron_expression: request.cron_expression,
        timezone,
        enabled: true,
        last_run_at: None,
        next_run_at,
        run_count: 0,
        created_at: now,
        updated_at: now,
    };

    db.create_schedule(&schedule)
        .await
        .map(|_| Json(schedule))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn update_schedule(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateScheduleRequest>,
) -> Result<StatusCode, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;

    match db.get_schedule(id).await {
        Ok(Some(schedule)) if schedule.project_id == ctx.project_id => {}
        Ok(Some(_)) => return Err(StatusCode::FORBIDDEN),
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    db.set_schedule_enabled(id, request.enabled)
        .await
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn delete_schedule(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;

    match db.get_schedule(id).await {
        Ok(Some(schedule)) if schedule.project_id == ctx.project_id => {}
        Ok(Some(_)) => return Err(StatusCode::FORBIDDEN),
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    db.delete_schedule(id)
        .await
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

#[derive(Debug, Deserialize)]
struct CreateWebhookRequest {
    name: String,
    url: String,
    events: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct UpdateWebhookRequest {
    enabled: bool,
}

async fn list_webhooks(
    State(db): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Webhook>>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    db.list_webhooks(ctx.project_id)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn create_webhook(
    State(db): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<CreateWebhookRequest>,
) -> Result<Json<Webhook>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;

    let now = Utc::now();
    let webhook = Webhook {
        id: Uuid::new_v4(),
        project_id: ctx.project_id,
        name: request.name,
        url: request.url,
        secret_hash: None,
        events: request.events,
        enabled: true,
        created_at: now,
        updated_at: now,
    };

    db.create_webhook(&webhook)
        .await
        .map(|_| Json(webhook))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn update_webhook(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateWebhookRequest>,
) -> Result<StatusCode, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;

    match db.get_webhook(id).await {
        Ok(Some(webhook)) if webhook.project_id == ctx.project_id => {}
        Ok(Some(_)) => return Err(StatusCode::FORBIDDEN),
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    db.set_webhook_enabled(id, request.enabled)
        .await
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn delete_webhook(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;

    match db.get_webhook(id).await {
        Ok(Some(webhook)) if webhook.project_id == ctx.project_id => {}
        Ok(Some(_)) => return Err(StatusCode::FORBIDDEN),
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    db.delete_webhook(id)
        .await
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn list_webhook_deliveries(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<Vec<WebhookDelivery>>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;

    match db.get_webhook(id).await {
        Ok(Some(webhook)) if webhook.project_id == ctx.project_id => {}
        Ok(Some(_)) => return Err(StatusCode::FORBIDDEN),
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    db.list_webhook_deliveries(id)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

#[derive(Debug, Deserialize)]
struct AuditLogQuery {
    limit: Option<i64>,
}

async fn list_audit_logs(
    State(db): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<AuditLogQuery>,
) -> Result<Json<Vec<AuditLog>>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    db.list_audit_logs(ctx.project_id, query.limit.unwrap_or(100).clamp(1, 500))
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

#[derive(Debug, Deserialize)]
struct UpsertRetentionPolicyRequest {
    resource_type: String,
    retention_days: i32,
}

async fn list_retention_policies(
    State(db): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<RetentionPolicy>>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    db.list_retention_policies(ctx.project_id)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn upsert_retention_policy(
    State(db): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<UpsertRetentionPolicyRequest>,
) -> Result<Json<RetentionPolicy>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    if request.retention_days < 1 {
        return Err(StatusCode::BAD_REQUEST);
    }
    db.upsert_retention_policy(
        ctx.project_id,
        &request.resource_type,
        request.retention_days,
    )
    .await
    .map(Json)
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

#[derive(Debug, Deserialize)]
struct ArtifactsQuery {
    limit: Option<i64>,
}

async fn list_artifacts(
    State(db): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<ArtifactsQuery>,
) -> Result<Json<Vec<Artifact>>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    db.list_artifacts(ctx.project_id, query.limit.unwrap_or(50).clamp(1, 500))
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn delete_artifact(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;

    match db.get_artifact(id).await {
        Ok(Some(artifact)) if artifact.project_id == ctx.project_id => {}
        Ok(Some(_)) => return Err(StatusCode::FORBIDDEN),
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    db.delete_artifact(id)
        .await
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn list_flaky_tests(
    State(db): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<FlakyTest>>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    db.list_flaky_tests(ctx.project_id)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

#[derive(Debug, Deserialize)]
struct UpdateFlakyTestRequest {
    status: String,
}

async fn update_flaky_test_status(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateFlakyTestRequest>,
) -> Result<StatusCode, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;

    match db.get_flaky_test(id).await {
        Ok(Some(test)) if test.project_id == ctx.project_id => {}
        Ok(Some(_)) => return Err(StatusCode::FORBIDDEN),
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    if !matches!(request.status.as_str(), "active" | "resolved" | "muted") {
        return Err(StatusCode::BAD_REQUEST);
    }

    db.set_flaky_test_status(id, &request.status)
        .await
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn list_plans(State(db): State<AppState>) -> Result<Json<Vec<Plan>>, StatusCode> {
    db.list_plans()
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn billing_status(
    State(db): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<BillingStatus>, StatusCode> {
    let ctx = human_context(&headers, &db).await;
    ensure_project_access(&db, &ctx).await?;
    let plan_slug = std::env::var("SPARKTEST_PLAN").unwrap_or_else(|_| "free".to_string());
    let plan = db
        .get_plan_by_slug(&plan_slug)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(BillingStatus {
        plan_name: if plan.slug == "pro" { "Pro" } else { "Free" }.to_string(),
        plan_slug: plan.slug,
    }))
}

async fn create_checkout_session(
    State(db): State<AppState>,
    Json(request): Json<CheckoutRequest>,
) -> Result<Json<CheckoutResponse>, StatusCode> {
    let plan = db
        .get_plan_by_slug(&request.plan_slug)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    if plan.price_cents == 0 {
        return Ok(Json(CheckoutResponse {
            checkout_url: request
                .success_url
                .unwrap_or_else(|| "http://localhost:3000".to_string()),
        }));
    }

    let stripe_secret_key =
        std::env::var("STRIPE_SECRET_KEY").map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let stripe_price_id = plan
        .stripe_price_id
        .clone()
        .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    let client = Client::new(stripe_secret_key);
    let success_url = request
        .success_url
        .unwrap_or_else(|| "http://localhost:3000?session_id={CHECKOUT_SESSION_ID}".to_string());
    let cancel_url = request
        .cancel_url
        .unwrap_or_else(|| "http://localhost:3000".to_string());

    let mut create_session = CreateCheckoutSession::new();
    create_session.mode = Some(CheckoutSessionMode::Subscription);
    create_session.success_url = Some(&success_url);
    create_session.cancel_url = Some(&cancel_url);
    create_session.line_items = Some(vec![CreateCheckoutSessionLineItems {
        price: Some(stripe_price_id),
        quantity: Some(1),
        ..Default::default()
    }]);

    let session = CheckoutSession::create(&client, create_session)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(CheckoutResponse {
        checkout_url: session.url.ok_or(StatusCode::INTERNAL_SERVER_ERROR)?,
    }))
}

fn verify_webhook_signature(
    payload: &[u8],
    signature: &str,
    webhook_secret: &str,
) -> Result<(), anyhow::Error> {
    let signature = signature
        .strip_prefix("v1=")
        .ok_or_else(|| anyhow::anyhow!("Invalid signature format"))?;
    let signature_bytes =
        hex::decode(signature).map_err(|_| anyhow::anyhow!("Invalid signature encoding"))?;
    let mut mac = HmacSha256::new_from_slice(webhook_secret.as_bytes())
        .map_err(|_| anyhow::anyhow!("Invalid webhook secret"))?;
    mac.update(payload);
    mac.verify_slice(&signature_bytes)
        .map_err(|_| anyhow::anyhow!("Signature verification failed"))
}

async fn handle_webhook(
    State(db): State<AppState>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<Json<Value>, StatusCode> {
    let webhook_secret =
        std::env::var("STRIPE_WEBHOOK_SECRET").map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let signature = headers
        .get("stripe-signature")
        .and_then(|h| h.to_str().ok())
        .ok_or(StatusCode::BAD_REQUEST)?;

    verify_webhook_signature(&body, signature, &webhook_secret)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;
    let event: WebhookEvent = serde_json::from_slice(&body).map_err(|_| StatusCode::BAD_REQUEST)?;

    match event.event_type.as_str() {
        "checkout.session.completed" => {
            handle_checkout_session_completed(&db, &event.data.object).await
        }
        "invoice.payment_failed" => {
            handle_subscription_status(&db, &event.data.object, "past_due").await
        }
        "customer.subscription.deleted" => {
            handle_subscription_status(&db, &event.data.object, "canceled").await
        }
        _ => Ok(()),
    }
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(json!({ "status": "ok" })))
}

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

    let organization = match db
        .get_organization_by_stripe_customer_id(customer_id)
        .await?
    {
        Some(org) => org,
        None => {
            let now = Utc::now();
            let org = Organization {
                id: Uuid::new_v4(),
                name: format!("Organization {}", customer_id),
                stripe_customer_id: Some(customer_id.to_string()),
                created_at: now,
                updated_at: now,
            };
            db.create_organization(&org).await?;
            org
        }
    };

    let pro_plan = db
        .get_plan_by_slug("pro")
        .await?
        .ok_or_else(|| anyhow::anyhow!("Pro plan not found"))?;
    let now = Utc::now();
    db.create_subscription(&OrgSubscription {
        id: Uuid::new_v4(),
        organization_id: organization.id,
        stripe_subscription_id: subscription_id.to_string(),
        status: "active".to_string(),
        current_period_end: now + chrono::Duration::days(30),
        plan_id: pro_plan.id,
        created_at: now,
        updated_at: now,
    })
    .await
}

async fn handle_subscription_status(
    db: &Database,
    event_data: &Value,
    status: &str,
) -> Result<(), anyhow::Error> {
    let subscription_id = event_data["subscription"]
        .as_str()
        .or_else(|| event_data["id"].as_str())
        .ok_or_else(|| anyhow::anyhow!("Missing subscription ID"))?;
    let mut subscription = db
        .get_subscription_by_stripe_id(subscription_id)
        .await?
        .ok_or_else(|| anyhow::anyhow!("Subscription not found: {}", subscription_id))?;
    subscription.status = status.to_string();
    subscription.updated_at = Utc::now();
    db.update_subscription(&subscription).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{body::Body, http::Request};
    use std::sync::OnceLock;
    use tokio::sync::Mutex;
    use tower::ServiceExt;

    static PLAN_ENV_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

    fn json_request(method: &str, uri: &str, token: Option<&str>, body: Value) -> Request<Body> {
        let mut builder = Request::builder()
            .method(method)
            .uri(uri)
            .header("content-type", "application/json");
        if let Some(token) = token {
            builder = builder.header("authorization", format!("Bearer {token}"));
        }
        builder.body(Body::from(body.to_string())).unwrap()
    }

    #[tokio::test]
    async fn checkout_request_serializes() {
        let request = CheckoutRequest {
            plan_slug: "pro".to_string(),
            success_url: Some("http://localhost:3000/success".to_string()),
            cancel_url: None,
        };
        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("pro"));
        let decoded: CheckoutRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(decoded.plan_slug, "pro");
    }

    #[tokio::test]
    async fn database_exposes_default_plans() {
        let db = Database::new("test://").await.unwrap();
        let plans = db.list_plans().await.unwrap();
        assert_eq!(plans.len(), 2);
        assert!(plans.iter().any(|plan| plan.slug == "free"));
    }

    #[tokio::test]
    async fn agent_tokens_require_authenticated_project_access() {
        let db = Database::new("test://").await.unwrap();
        let app = create_app(db);

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/api/agent-tokens")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::FORBIDDEN);
    }

    #[tokio::test]
    async fn agent_endpoints_reject_missing_or_invalid_tokens() {
        let db = Database::new("test://").await.unwrap();
        let app = create_app(db);

        let missing = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/agent/check-in",
                None,
                json!({ "name": "agent-1" }),
            ))
            .await
            .unwrap();
        assert_eq!(missing.status(), StatusCode::UNAUTHORIZED);

        let invalid = app
            .oneshot(json_request(
                "POST",
                "/api/agent/next-run",
                Some("not-a-real-token"),
                json!({ "name": "agent-1" }),
            ))
            .await
            .unwrap();
        assert_eq!(invalid.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn agent_check_in_registers_agent_for_the_token_project() {
        let db = Database::new("test://").await.unwrap();
        let project_id = db.default_project_id();
        let token = db
            .create_agent_token(project_id, "cluster".to_string())
            .await
            .unwrap();
        let app = create_app(db.clone());

        let response = app
            .oneshot(json_request(
                "POST",
                "/api/agent/check-in",
                Some(&token.token),
                json!({
                    "name": "agent-1",
                    "version": "0.1.0",
                    "status": "online"
                }),
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let agents = db.list_agents(project_id).await.unwrap();
        assert_eq!(agents.len(), 1);
        assert_eq!(agents[0].name, "agent-1");
        assert_eq!(agents[0].version.as_deref(), Some("0.1.0"));
        assert_eq!(agents[0].status, "online");
    }

    #[tokio::test]
    async fn agent_can_claim_and_complete_a_queued_run_over_http() {
        let db = Database::new("test://").await.unwrap();
        let project_id = db.default_project_id();
        let token = db
            .create_agent_token(project_id, "cluster".to_string())
            .await
            .unwrap();
        let now = Utc::now();
        let run = SaasTestRun {
            id: Uuid::new_v4(),
            project_id,
            definition_id: None,
            suite_id: None,
            executor_id: None,
            agent_id: None,
            status: "queued".to_string(),
            result: None,
            error: None,
            queued_at: now,
            started_at: None,
            finished_at: None,
            created_at: now,
            updated_at: now,
            target_environment_id: None,
        };
        db.create_test_run(&run).await.unwrap();
        let app = create_app(db.clone());

        let claim = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/agent/next-run",
                Some(&token.token),
                json!({
                    "name": "agent-1",
                    "version": "0.1.0"
                }),
            ))
            .await
            .unwrap();
        assert_eq!(claim.status(), StatusCode::OK);

        let claimed = db.get_test_run(run.id).await.unwrap().unwrap();
        assert_eq!(claimed.status, "running");
        assert!(claimed.agent_id.is_some());
        assert!(claimed.started_at.is_some());

        let completed = app
            .clone()
            .oneshot(json_request(
                "POST",
                &format!("/api/agent/runs/{}/status", run.id),
                Some(&token.token),
                json!({
                    "status": "passed",
                    "result": { "exit_code": 0 },
                    "error": null
                }),
            ))
            .await
            .unwrap();
        assert_eq!(completed.status(), StatusCode::OK);

        let finished = db.get_test_run(run.id).await.unwrap().unwrap();
        assert_eq!(finished.status, "passed");
        assert_eq!(finished.result, Some(json!({ "exit_code": 0 })));
        assert!(finished.finished_at.is_some());
        let replay = app
            .oneshot(json_request(
                "POST",
                &format!("/api/agent/runs/{}/status", run.id),
                Some(&token.token),
                json!({ "status": "passed", "result": { "exit_code": 0 }, "error": null }),
            ))
            .await
            .unwrap();
        assert_eq!(replay.status(), StatusCode::OK);
        let replayed = db.get_test_run(run.id).await.unwrap().unwrap();
        assert_eq!(finished.finished_at, replayed.finished_at);
        assert_eq!(finished.updated_at, replayed.updated_at);
    }

    #[tokio::test]
    async fn agent_cannot_update_a_run_from_another_project() {
        let db = Database::new("test://").await.unwrap();
        let token = db
            .create_agent_token(db.default_project_id(), "cluster".to_string())
            .await
            .unwrap();
        let other_project = db
            .create_project(
                Project {
                    id: Uuid::nil(),
                    name: "Other".to_string(),
                    slug: String::new(),
                    created_at: Utc::now(),
                    updated_at: Utc::now(),
                },
                None,
            )
            .await
            .unwrap();
        let now = Utc::now();
        let run = SaasTestRun {
            id: Uuid::new_v4(),
            project_id: other_project.id,
            definition_id: None,
            suite_id: None,
            executor_id: None,
            agent_id: None,
            status: "queued".to_string(),
            result: None,
            error: None,
            queued_at: now,
            started_at: None,
            finished_at: None,
            created_at: now,
            updated_at: now,
            target_environment_id: None,
        };
        db.create_test_run(&run).await.unwrap();
        let app = create_app(db);

        let response = app
            .oneshot(json_request(
                "POST",
                &format!("/api/agent/runs/{}/status", run.id),
                Some(&token.token),
                json!({ "status": "passed", "result": null, "error": null }),
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::FORBIDDEN);
    }

    #[tokio::test]
    async fn creating_second_free_agent_token_requires_payment() {
        let _guard = PLAN_ENV_LOCK.get_or_init(|| Mutex::new(())).lock().await;
        let previous_plan = std::env::var("SPARKTEST_PLAN").ok();
        std::env::set_var("SPARKTEST_PLAN", "free");

        let db = Database::new("test://").await.unwrap();
        let project_id = db.default_project_id();
        db.create_agent_token(project_id, "first".to_string())
            .await
            .unwrap();

        let limit = enforce_agent_limit(&db, project_id).await;

        match previous_plan {
            Some(plan) => std::env::set_var("SPARKTEST_PLAN", plan),
            None => std::env::remove_var("SPARKTEST_PLAN"),
        }
        assert_eq!(limit, Err(StatusCode::PAYMENT_REQUIRED));
    }

    #[tokio::test]
    async fn paid_plan_allows_more_than_one_agent_token() {
        let _guard = PLAN_ENV_LOCK.get_or_init(|| Mutex::new(())).lock().await;
        let previous_plan = std::env::var("SPARKTEST_PLAN").ok();
        std::env::set_var("SPARKTEST_PLAN", "pro");

        let db = Database::new("test://").await.unwrap();
        let project_id = db.default_project_id();
        db.create_agent_token(project_id, "first".to_string())
            .await
            .unwrap();

        let limit = enforce_agent_limit(&db, project_id).await;

        match previous_plan {
            Some(plan) => std::env::set_var("SPARKTEST_PLAN", plan),
            None => std::env::remove_var("SPARKTEST_PLAN"),
        }
        assert_eq!(limit, Ok(()));
    }

    #[tokio::test]
    async fn projects_require_authenticated_user() {
        let db = Database::new("test://").await.unwrap();
        let app = create_app(db);

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/api/projects")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[test]
    fn webhook_signature_verification_accepts_valid_hmac() {
        let secret = "test_webhook_secret";
        let payload = b"test_payload";
        let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).unwrap();
        mac.update(payload);
        let signature = format!("v1={}", hex::encode(mac.finalize().into_bytes()));

        assert!(verify_webhook_signature(payload, &signature, secret).is_ok());
        assert!(verify_webhook_signature(payload, "v1=invalid", secret).is_err());
    }
}
