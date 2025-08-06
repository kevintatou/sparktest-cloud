use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{delete, get, post, put},
    Json, Router,
};
use serde_json::{json, Value};
use sparktest_saas_core::{Database, SaasTestDefinition, SaasTestRun, SaasExecutor, SaasTestSuite};
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use uuid::Uuid;
use chrono::Utc;

pub type AppState = Arc<Database>;

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
    State(db): State<AppState>,
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