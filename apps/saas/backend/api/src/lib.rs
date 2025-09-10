use axum::{
    extract::{Path, State, Query},
    http::{StatusCode, HeaderMap},
    routing::{delete, get, post, put},
    Json, Router,
    middleware,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sparktest_saas_core::{Database, SaasTestDefinition, SaasTestRun, SaasExecutor, SaasTestSuite, Organization, OrgContext};
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use uuid::Uuid;
use chrono::Utc;

#[derive(Deserialize)]
pub struct CreateTestDefinitionRequest {
    pub name: String,
    pub description: Option<String>,
    pub code: String,
    pub language: String,
    pub is_public: bool,
}

#[derive(Deserialize)]
pub struct CreateTestRunRequest {
    pub definition_id: Uuid,
    pub status: String,
}

#[derive(Deserialize)]
pub struct CreateExecutorRequest {
    pub name: String,
    pub executor_type: String,
    pub config: serde_json::Value,
    pub status: String,
}

#[derive(Deserialize)]
pub struct CreateTestSuiteRequest {
    pub name: String,
    pub description: Option<String>,
    pub test_definitions: Vec<Uuid>,
}

pub type AppState = Arc<Database>;

#[derive(Deserialize)]
pub struct OrgQuery {
    pub org: Option<String>,
}

pub fn create_app(database: Database) -> Router {
    let state = Arc::new(database);
    
    Router::new()
        .route("/api/health", get(health_check))
        // Organizations
        .route("/api/organizations", get(list_organizations))
        .route("/api/organizations/:slug", get(get_organization_by_slug))
        // Org-scoped routes  
        .route("/api/orgs/:org_slug/test-definitions", get(list_test_definitions).post(create_test_definition))
        .route("/api/orgs/:org_slug/test-definitions/:id", get(get_test_definition).put(update_test_definition).delete(delete_test_definition))
        .route("/api/orgs/:org_slug/test-runs", get(list_test_runs).post(create_test_run))
        .route("/api/orgs/:org_slug/test-runs/:id", get(get_test_run))
        .route("/api/orgs/:org_slug/executors", get(list_executors).post(create_executor))
        .route("/api/orgs/:org_slug/executors/:id", get(get_executor).put(update_executor).delete(delete_executor))
        .route("/api/orgs/:org_slug/test-suites", get(list_test_suites).post(create_test_suite))
        .route("/api/orgs/:org_slug/test-suites/:id", get(get_test_suite).put(update_test_suite).delete(delete_test_suite))
        .layer(CorsLayer::permissive())
        .with_state(state)
}

async fn health_check() -> Json<Value> {
    Json(json!({ "status": "ok", "timestamp": Utc::now() }))
}

// Helper function to get org context from path
async fn get_org_context(db: &Database, org_slug: &str) -> Result<Uuid, StatusCode> {
    match db.get_organization_by_slug(org_slug).await {
        Ok(Some(org)) => Ok(org.id),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

// Organization handlers
async fn list_organizations(State(db): State<AppState>) -> Result<Json<Vec<Organization>>, StatusCode> {
    match db.list_organizations().await {
        Ok(orgs) => Ok(Json(orgs)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn get_organization_by_slug(
    State(db): State<AppState>,
    Path(slug): Path<String>,
) -> Result<Json<Organization>, StatusCode> {
    match db.get_organization_by_slug(&slug).await {
        Ok(Some(org)) => Ok(Json(org)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

// Test Definition handlers
async fn list_test_definitions(
    State(db): State<AppState>,
    Path(org_slug): Path<String>,
) -> Result<Json<Vec<SaasTestDefinition>>, StatusCode> {
    let org_id = get_org_context(&db, &org_slug).await?;
    match db.list_test_definitions(org_id).await {
        Ok(definitions) => Ok(Json(definitions)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn create_test_definition(
    State(db): State<AppState>,
    Path(org_slug): Path<String>,
    Json(request): Json<CreateTestDefinitionRequest>,
) -> Result<Json<SaasTestDefinition>, StatusCode> {
    let org_id = get_org_context(&db, &org_slug).await?;
    
    let definition = SaasTestDefinition {
        id: Uuid::new_v4(),
        name: request.name,
        description: request.description,
        code: request.code,
        language: request.language,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        user_id: None, // TODO: Get from auth context
        organization_id: Some(org_id),
        is_public: request.is_public,
    };

    match db.create_test_definition(&definition).await {
        Ok(_) => Ok(Json(definition)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn get_test_definition(
    State(db): State<AppState>,
    Path((org_slug, id)): Path<(String, Uuid)>,
) -> Result<Json<SaasTestDefinition>, StatusCode> {
    let org_id = get_org_context(&db, &org_slug).await?;
    match db.get_test_definition(id, org_id).await {
        Ok(Some(definition)) => Ok(Json(definition)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn update_test_definition(
    State(db): State<AppState>,
    Path((org_slug, id)): Path<(String, Uuid)>,
    Json(mut definition): Json<SaasTestDefinition>,
) -> Result<Json<SaasTestDefinition>, StatusCode> {
    let org_id = get_org_context(&db, &org_slug).await?;
    definition.id = id;
    definition.updated_at = Utc::now();
    definition.organization_id = Some(org_id);

    // For now, just return the updated definition
    // In a real implementation, you'd update in the database
    Ok(Json(definition))
}

async fn delete_test_definition(
    State(db): State<AppState>,
    Path((org_slug, id)): Path<(String, Uuid)>,
) -> Result<StatusCode, StatusCode> {
    let org_id = get_org_context(&db, &org_slug).await?;
    match db.delete_test_definition(id, org_id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

// Test Run handlers
async fn list_test_runs(
    State(db): State<AppState>,
    Path(org_slug): Path<String>,
) -> Result<Json<Vec<SaasTestRun>>, StatusCode> {
    let org_id = get_org_context(&db, &org_slug).await?;
    match db.list_test_runs(org_id).await {
        Ok(runs) => Ok(Json(runs)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn create_test_run(
    State(db): State<AppState>,
    Path(org_slug): Path<String>,
    Json(request): Json<CreateTestRunRequest>,
) -> Result<Json<SaasTestRun>, StatusCode> {
    let org_id = get_org_context(&db, &org_slug).await?;
    
    // Check policy limits before creating run
    match db.check_run_limits(org_id).await {
        Ok(false) => return Err(StatusCode::TOO_MANY_REQUESTS),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
        _ => {}
    }
    
    let run = SaasTestRun {
        id: Uuid::new_v4(),
        definition_id: request.definition_id,
        status: request.status,
        result: None,
        error: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        user_id: None, // TODO: Get from auth context
        organization_id: Some(org_id),
    };

    match db.create_test_run(&run).await {
        Ok(_) => Ok(Json(run)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn get_test_run(
    State(db): State<AppState>,
    Path((org_slug, id)): Path<(String, Uuid)>,
) -> Result<Json<SaasTestRun>, StatusCode> {
    let org_id = get_org_context(&db, &org_slug).await?;
    match db.get_test_run(id, org_id).await {
        Ok(Some(run)) => Ok(Json(run)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

// Executor handlers
async fn list_executors(
    State(db): State<AppState>,
    Path(org_slug): Path<String>,
) -> Result<Json<Vec<SaasExecutor>>, StatusCode> {
    let org_id = get_org_context(&db, &org_slug).await?;
    match db.list_executors(org_id).await {
        Ok(executors) => Ok(Json(executors)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn create_executor(
    State(db): State<AppState>,
    Path(org_slug): Path<String>,
    Json(request): Json<CreateExecutorRequest>,
) -> Result<Json<SaasExecutor>, StatusCode> {
    let org_id = get_org_context(&db, &org_slug).await?;
    
    let executor = SaasExecutor {
        id: Uuid::new_v4(),
        name: request.name,
        executor_type: request.executor_type,
        config: request.config,
        status: request.status,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        user_id: None, // TODO: Get from auth context
        organization_id: Some(org_id),
    };
    
    match db.create_executor(&executor).await {
        Ok(_) => Ok(Json(executor)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn get_executor(
    State(db): State<AppState>,
    Path((org_slug, id)): Path<(String, Uuid)>,
) -> Result<Json<SaasExecutor>, StatusCode> {
    let org_id = get_org_context(&db, &org_slug).await?;
    match db.get_executor(id, org_id).await {
        Ok(Some(executor)) => Ok(Json(executor)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn update_executor(
    State(_db): State<AppState>,
    Path((_org_slug, _id)): Path<(String, Uuid)>,
    Json(executor): Json<SaasExecutor>,
) -> Result<Json<SaasExecutor>, StatusCode> {
    // Placeholder implementation
    Ok(Json(executor))
}

async fn delete_executor(
    State(db): State<AppState>,
    Path((org_slug, id)): Path<(String, Uuid)>,
) -> Result<StatusCode, StatusCode> {
    let org_id = get_org_context(&db, &org_slug).await?;
    match db.delete_executor(id, org_id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

// Test Suite handlers
async fn list_test_suites(
    State(db): State<AppState>,
    Path(org_slug): Path<String>,
) -> Result<Json<Vec<SaasTestSuite>>, StatusCode> {
    let org_id = get_org_context(&db, &org_slug).await?;
    match db.list_test_suites(org_id).await {
        Ok(suites) => Ok(Json(suites)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn create_test_suite(
    State(db): State<AppState>,
    Path(org_slug): Path<String>,
    Json(request): Json<CreateTestSuiteRequest>,
) -> Result<Json<SaasTestSuite>, StatusCode> {
    let org_id = get_org_context(&db, &org_slug).await?;
    
    let suite = SaasTestSuite {
        id: Uuid::new_v4(),
        name: request.name,
        description: request.description,
        test_definitions: request.test_definitions,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        user_id: None, // TODO: Get from auth context
        organization_id: Some(org_id),
    };
    
    match db.create_test_suite(&suite).await {
        Ok(_) => Ok(Json(suite)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn get_test_suite(
    State(db): State<AppState>,
    Path((org_slug, id)): Path<(String, Uuid)>,
) -> Result<Json<SaasTestSuite>, StatusCode> {
    let org_id = get_org_context(&db, &org_slug).await?;
    match db.get_test_suite(id, org_id).await {
        Ok(Some(suite)) => Ok(Json(suite)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn update_test_suite(
    State(_db): State<AppState>,
    Path((_org_slug, _id)): Path<(String, Uuid)>,
    Json(suite): Json<SaasTestSuite>,
) -> Result<Json<SaasTestSuite>, StatusCode> {
    // Placeholder implementation
    Ok(Json(suite))
}

async fn delete_test_suite(
    State(db): State<AppState>,
    Path((org_slug, id)): Path<(String, Uuid)>,
) -> Result<StatusCode, StatusCode> {
    let org_id = get_org_context(&db, &org_slug).await?;
    match db.delete_test_suite(id, org_id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}