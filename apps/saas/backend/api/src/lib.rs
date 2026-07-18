use axum::{
    body::Bytes,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    routing::{delete, get, patch, post},
    Json, Router,
};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use chrono::Utc;
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::Sha256;
use sparktest_saas_core::{
    schedule_next_run_at, Agent, AgentToken, AgentTokenCreated, Database, Executor,
    OrgSubscription, Organization, Plan, Profile, Project, ProjectMember, SaasTestDefinition,
    SaasTestRun, Schedule, TestSuite,
};
use std::sync::Arc;
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
}

#[derive(Debug, Clone)]
struct HumanContext {
    user_id: Option<Uuid>,
    email: Option<String>,
    project_id: Uuid,
}

#[derive(Debug, Deserialize)]
struct SupabaseClaims {
    sub: String,
    email: Option<String>,
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
        .route("/api/billing/plans", get(list_plans))
        .route("/api/billing/checkout", post(create_checkout_session))
        .route("/api/billing/webhook", post(handle_webhook))
        .layer(CorsLayer::permissive())
        .with_state(state)
}

async fn health_check() -> Json<Value> {
    Json(json!({ "status": "ok", "timestamp": Utc::now() }))
}

fn human_context(headers: &HeaderMap, db: &Database) -> HumanContext {
    let jwt_claims = verify_supabase_jwt(headers);
    let user_id = jwt_claims
        .as_ref()
        .and_then(|claims| Uuid::parse_str(&claims.sub).ok())
        .or_else(|| {
            headers
                .get("x-user-id")
                .and_then(|value| value.to_str().ok())
                .and_then(|value| Uuid::parse_str(value).ok())
        });
    let project_id = headers
        .get("x-project-id")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| Uuid::parse_str(value).ok())
        .unwrap_or_else(|| db.default_project_id());

    HumanContext {
        user_id,
        email: jwt_claims.and_then(|claims| claims.email),
        project_id,
    }
}

fn verify_supabase_jwt(headers: &HeaderMap) -> Option<SupabaseClaims> {
    let secret = std::env::var("SUPABASE_JWT_SECRET").ok()?;
    let token = bearer_token(headers)?;
    let mut parts = token.split('.');
    let header = parts.next()?;
    let payload = parts.next()?;
    let signature = parts.next()?;
    if parts.next().is_some() {
        return None;
    }

    let signed = format!("{header}.{payload}");
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).ok()?;
    mac.update(signed.as_bytes());
    let expected = URL_SAFE_NO_PAD.encode(mac.finalize().into_bytes());
    if expected != signature {
        return None;
    }

    let payload = URL_SAFE_NO_PAD.decode(payload).ok()?;
    serde_json::from_slice(&payload).ok()
}

async fn ensure_project_access(db: &Database, ctx: &HumanContext) -> Result<(), StatusCode> {
    match db.has_project_access(ctx.project_id, ctx.user_id).await {
        Ok(true) => Ok(()),
        Ok(false) => Err(StatusCode::FORBIDDEN),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
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
    let ctx = human_context(&headers, &db);
    let user_id = ctx.user_id.unwrap_or_else(Uuid::new_v4);
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
    let ctx = human_context(&headers, &db);
    db.list_projects(ctx.user_id)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn create_project(
    State(db): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<ProjectRequest>,
) -> Result<Json<Project>, StatusCode> {
    let ctx = human_context(&headers, &db);
    enforce_project_limit(&db).await?;
    let now = Utc::now();
    let project = Project {
        id: Uuid::nil(),
        name: request.name,
        slug: String::new(),
        created_at: now,
        updated_at: now,
    };
    db.create_project(project, ctx.user_id)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn list_project_members(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(project_id): Path<Uuid>,
) -> Result<Json<Vec<ProjectMember>>, StatusCode> {
    let mut ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
    ensure_project_access(&db, &ctx).await?;
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
    let ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
    ensure_project_access(&db, &ctx).await?;
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
    let ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
    ensure_project_access(&db, &ctx).await?;
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
        .map(|_| Json(run))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn get_test_run(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<SaasTestRun>, StatusCode> {
    let ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
    ensure_project_access(&db, &ctx).await?;
    db.delete_executor(id)
        .await
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn list_test_suites(
    State(db): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<TestSuite>>, StatusCode> {
    let ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
    ensure_project_access(&db, &ctx).await?;
    enforce_agent_limit(&db, ctx.project_id).await?;
    db.create_agent_token(ctx.project_id, request.name)
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn enforce_project_limit(db: &Database) -> Result<(), StatusCode> {
    let count = db
        .count_projects()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    if count >= 1
        && std::env::var("SPARKTEST_PLAN").unwrap_or_else(|_| "free".to_string()) == "free"
    {
        return Err(StatusCode::PAYMENT_REQUIRED);
    }
    Ok(())
}

async fn enforce_agent_limit(db: &Database, project_id: Uuid) -> Result<(), StatusCode> {
    let count = db
        .count_active_agent_tokens(project_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    if count >= 1
        && std::env::var("SPARKTEST_PLAN").unwrap_or_else(|_| "free".to_string()) == "free"
    {
        return Err(StatusCode::PAYMENT_REQUIRED);
    }
    Ok(())
}

async fn revoke_agent_token(
    State(db): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    let ctx = human_context(&headers, &db);
    ensure_project_access(&db, &ctx).await?;
    db.revoke_agent_token(id)
        .await
        .map(|_| StatusCode::NO_CONTENT)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn list_agents(
    State(db): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Agent>>, StatusCode> {
    let ctx = human_context(&headers, &db);
    ensure_project_access(&db, &ctx).await?;
    db.list_agents(ctx.project_id)
        .await
        .map(Json)
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
    Ok(Json(QueueResponse { run, definition }))
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
        .map(|_| Json(run))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn agent_trigger_run(
    State(db): State<AppState>,
    headers: HeaderMap,
    Json(request): Json<TriggerRunRequest>,
) -> Result<Json<SaasTestRun>, StatusCode> {
    let token = authenticate_agent(&headers, &db).await?;
    let now = Utc::now();
    let run = SaasTestRun {
        id: Uuid::new_v4(),
        project_id: token.project_id,
        definition_id: Some(request.definition_id),
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
    };
    db.create_test_run(&run)
        .await
        .map(|_| Json(run))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
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
    let ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
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
    let ctx = human_context(&headers, &db);
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

async fn list_plans(State(db): State<AppState>) -> Result<Json<Vec<Plan>>, StatusCode> {
    db.list_plans()
        .await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
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
