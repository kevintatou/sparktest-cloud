use axum::{
    extract::{Query, Path},
    http::{Method, StatusCode},
    middleware,
    response::Json,
    routing::{get, post, delete},
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tower::ServiceBuilder;
use tower_http::cors::{CorsLayer, Any};
use tracing::{info, warn, error};
use chrono::{DateTime, Utc};
use uuid::Uuid;

// SparkTest Types (mirroring TypeScript types)
#[derive(Serialize, Deserialize, Clone)]
pub struct Definition {
    pub id: String,
    pub name: String,
    pub description: String,
    pub image: String,
    pub commands: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub executor_id: Option<String>,
    pub variables: Option<HashMap<String, String>>,
    pub labels: Option<Vec<String>>,
    pub source: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct TestRun {
    pub id: String,
    pub name: String,
    pub image: String,
    pub command: Vec<String>,
    pub status: String, // "running" | "completed" | "failed"
    pub created_at: DateTime<Utc>,
    pub definition_id: Option<String>,
    pub executor_id: Option<String>,
    pub suite_id: Option<String>,
    pub variables: Option<HashMap<String, String>>,
    pub artifacts: Option<Vec<String>>,
    pub duration: Option<u64>,
    pub retries: Option<u32>,
    pub logs: Option<Vec<String>>,
    pub k8s_job_name: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct TestSuite {
    pub id: String,
    pub name: String,
    pub description: String,
    pub test_definition_ids: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub execution_mode: String, // "sequential" | "parallel"
    pub labels: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Executor {
    pub id: String,
    pub name: String,
    pub image: String,
    pub description: Option<String>,
    pub command: Option<Vec<String>>,
    pub supported_file_types: Option<Vec<String>>,
    pub env: Option<HashMap<String, String>>,
    pub created_at: DateTime<Utc>,
}

// Request/Response types
#[derive(Serialize, Deserialize)]
pub struct CreateRunRequest {
    pub definition_id: String,
    pub name: Option<String>,
    pub variables: Option<HashMap<String, String>>,
}

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
    pub timestamp: DateTime<Utc>,
    pub kubernetes_connected: bool,
    pub services: HashMap<String, String>,
}

#[derive(Serialize)]
pub struct KubernetesStatus {
    pub connected: bool,
    pub cluster_info: Option<String>,
    pub namespace: String,
}

#[derive(Deserialize)]
pub struct RunQuery {
    pub status: Option<String>,
    pub definition_id: Option<String>,
}

// In-memory storage (would be replaced with database in production)
use std::sync::{Arc, Mutex};

type Storage = Arc<Mutex<StorageData>>;

#[derive(Default)]
struct StorageData {
    definitions: HashMap<String, Definition>,
    runs: HashMap<String, TestRun>,
    suites: HashMap<String, TestSuite>,
    executors: HashMap<String, Executor>,
}

// Middleware for logging
async fn logging_middleware(
    request: axum::extract::Request,
    next: axum::middleware::Next,
) -> axum::response::Response {
    let method = request.method().clone();
    let uri = request.uri().clone();
    
    info!("📡 {} {}", method, uri);
    
    let response = next.run(request).await;
    
    info!("✅ {} {} - {}", method, uri, response.status());
    
    response
}

// Initialize sample data
fn init_sample_data(storage: Storage) {
    let mut data = storage.lock().unwrap();
    
    // Sample definitions
    let sample_defs = vec![
        Definition {
            id: "simple-health-check".to_string(),
            name: "Simple Health Check".to_string(),
            description: "Basic system health check using curl".to_string(),
            image: "curlimages/curl:latest".to_string(),
            commands: vec!["curl -f -s -o /dev/null -w \"%{http_code}\" https://httpbin.org/status/200 && echo \"Health check passed\"".to_string()],
            created_at: Utc::now(),
            executor_id: None,
            variables: None,
            labels: Some(vec!["working".to_string(), "health".to_string()]),
            source: None,
        },
        Definition {
            id: "basic-python-test".to_string(),
            name: "Basic Python Test".to_string(),
            description: "Simple Python test without external dependencies".to_string(),
            image: "python:3.9-slim".to_string(),
            commands: vec!["python -c \"import sys; print(f'Python version: {sys.version}'); assert 2 + 2 == 4; print('Basic math test passed')\"".to_string()],
            created_at: Utc::now(),
            executor_id: None,
            variables: None,
            labels: Some(vec!["working".to_string(), "python".to_string()]),
            source: None,
        },
        Definition {
            id: "node-version-test".to_string(),
            name: "Node.js Version Test".to_string(),
            description: "Test Node.js installation and basic functionality".to_string(),
            image: "node:18-alpine".to_string(),
            commands: vec!["node -e \"console.log('Node.js version:', process.version); console.log('Test passed: 2 + 2 =', 2 + 2); process.exit(0)\"".to_string()],
            created_at: Utc::now(),
            executor_id: None,
            variables: None,
            labels: Some(vec!["working".to_string(), "nodejs".to_string()]),
            source: None,
        }
    ];

    for def in sample_defs {
        data.definitions.insert(def.id.clone(), def);
    }

    // Sample executors
    let sample_executors = vec![
        Executor {
            id: "docker-executor".to_string(),
            name: "Docker Container Runner".to_string(),
            image: "docker:latest".to_string(),
            description: Some("Run tests in isolated Docker containers".to_string()),
            command: Some(vec!["docker".to_string(), "run".to_string(), "--rm".to_string()]),
            supported_file_types: Some(vec!["dockerfile".to_string(), "yaml".to_string()]),
            env: Some([("DOCKER_BUILDKIT".to_string(), "1".to_string())].into()),
            created_at: Utc::now(),
        }
    ];

    for executor in sample_executors {
        data.executors.insert(executor.id.clone(), executor);
    }

    info!("✅ Initialized sample data: {} definitions, {} executors", 
          data.definitions.len(), data.executors.len());
}

// API Handlers

// Health endpoint
async fn health() -> Json<HealthResponse> {
    let mut services = HashMap::new();
    services.insert("api".to_string(), "healthy".to_string());
    services.insert("storage".to_string(), "healthy".to_string());
    
    // Mock Kubernetes status
    let k8s_connected = std::env::var("KUBERNETES_SERVICE_HOST").is_ok();
    services.insert("kubernetes".to_string(), 
        if k8s_connected { "connected".to_string() } else { "not_connected".to_string() });

    Json(HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        timestamp: Utc::now(),
        kubernetes_connected: k8s_connected,
        services,
    })
}

// Kubernetes status
async fn kubernetes_status() -> Json<KubernetesStatus> {
    let connected = std::env::var("KUBERNETES_SERVICE_HOST").is_ok();
    
    Json(KubernetesStatus {
        connected,
        cluster_info: if connected { 
            Some("Kubernetes cluster detected".to_string()) 
        } else { 
            None 
        },
        namespace: std::env::var("POD_NAMESPACE").unwrap_or_else(|_| "default".to_string()),
    })
}

// Get all definitions
async fn get_definitions(
    axum::extract::State(storage): axum::extract::State<Storage>
) -> Json<Vec<Definition>> {
    let data = storage.lock().unwrap();
    let definitions: Vec<Definition> = data.definitions.values().cloned().collect();
    Json(definitions)
}

// Get definition by ID
async fn get_definition(
    Path(id): Path<String>,
    axum::extract::State(storage): axum::extract::State<Storage>
) -> Result<Json<Definition>, StatusCode> {
    let data = storage.lock().unwrap();
    match data.definitions.get(&id) {
        Some(definition) => Ok(Json(definition.clone())),
        None => Err(StatusCode::NOT_FOUND),
    }
}

// Get all runs
async fn get_runs(
    Query(params): Query<RunQuery>,
    axum::extract::State(storage): axum::extract::State<Storage>
) -> Json<Vec<TestRun>> {
    let data = storage.lock().unwrap();
    let mut runs: Vec<TestRun> = data.runs.values().cloned().collect();
    
    // Filter by status if provided
    if let Some(status) = params.status {
        runs.retain(|run| run.status == status);
    }
    
    // Filter by definition_id if provided
    if let Some(def_id) = params.definition_id {
        runs.retain(|run| run.definition_id.as_ref() == Some(&def_id));
    }
    
    // Sort by created_at descending
    runs.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    
    Json(runs)
}

// Create new run
async fn create_run(
    axum::extract::State(storage): axum::extract::State<Storage>,
    Json(payload): Json<CreateRunRequest>
) -> Result<Json<TestRun>, StatusCode> {
    let mut data = storage.lock().unwrap();
    
    // Find the definition
    let definition = match data.definitions.get(&payload.definition_id) {
        Some(def) => def.clone(),
        None => return Err(StatusCode::NOT_FOUND),
    };
    
    let run_id = Uuid::new_v4().to_string();
    let run_name = payload.name.unwrap_or_else(|| 
        format!("{} - {}", definition.name, Utc::now().format("%H:%M:%S"))
    );
    
    let new_run = TestRun {
        id: run_id.clone(),
        name: run_name,
        image: definition.image.clone(),
        command: definition.commands.clone(),
        status: "running".to_string(),
        created_at: Utc::now(),
        definition_id: Some(payload.definition_id),
        executor_id: definition.executor_id.clone(),
        suite_id: None,
        variables: payload.variables.or(definition.variables.clone()),
        artifacts: Some(vec![]),
        duration: None,
        retries: Some(0),
        logs: Some(vec![
            format!("> Starting test: {}", definition.name),
            "> Initializing container...".to_string(),
        ]),
        k8s_job_name: Some(format!("sparktest-{}", &run_id[..8])),
    };
    
    info!("🚀 Created new test run: {} ({})", new_run.name, run_id);
    
    // Simulate test execution in background
    let storage_clone = storage.clone();
    let run_id_clone = run_id.clone();
    tokio::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
        
        let mut data = storage_clone.lock().unwrap();
        if let Some(run) = data.runs.get_mut(&run_id_clone) {
            // Simulate random success/failure
            let success = rand::random::<f32>() > 0.3;
            run.status = if success { "completed".to_string() } else { "failed".to_string() };
            run.duration = Some(rand::random::<u64>() % 30000 + 5000); // 5-35 seconds
            
            if let Some(logs) = &mut run.logs {
                logs.push("> Container started".to_string());
                logs.push("> Running tests...".to_string());
                logs.push(if success {
                    "✅ Tests completed successfully".to_string()
                } else {
                    "❌ Tests failed".to_string()
                });
            }
            
            info!("✅ Test run completed: {} - {}", run_id_clone, run.status);
        }
    });
    
    data.runs.insert(run_id, new_run.clone());
    Ok(Json(new_run))
}

// Delete run
async fn delete_run(
    Path(id): Path<String>,
    axum::extract::State(storage): axum::extract::State<Storage>
) -> Result<StatusCode, StatusCode> {
    let mut data = storage.lock().unwrap();
    match data.runs.remove(&id) {
        Some(_) => {
            info!("🗑️ Deleted test run: {}", id);
            Ok(StatusCode::NO_CONTENT)
        },
        None => Err(StatusCode::NOT_FOUND),
    }
}

// Get all suites
async fn get_suites(
    axum::extract::State(storage): axum::extract::State<Storage>
) -> Json<Vec<TestSuite>> {
    let data = storage.lock().unwrap();
    let suites: Vec<TestSuite> = data.suites.values().cloned().collect();
    Json(suites)
}

// Get all executors
async fn get_executors(
    axum::extract::State(storage): axum::extract::State<Storage>
) -> Json<Vec<Executor>> {
    let data = storage.lock().unwrap();
    let executors: Vec<Executor> = data.executors.values().cloned().collect();
    Json(executors)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter("info,saas_backend=debug")
        .init();

    info!("🚀 Starting SparkTest Backend v{}", env!("CARGO_PKG_VERSION"));
    info!("⚡ Kubernetes Test Orchestration Platform");

    // Initialize storage with sample data
    let storage: Storage = Arc::new(Mutex::new(StorageData::default()));
    init_sample_data(storage.clone());

    // Create CORS layer
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers(Any);

    // Build the router
    let app = Router::new()
        // Health endpoints
        .route("/health", get(health))
        .route("/api/health", get(health))
        .route("/api/kubernetes/status", get(kubernetes_status))
        
        // Test definitions
        .route("/api/definitions", get(get_definitions))
        .route("/api/definitions/:id", get(get_definition))
        
        // Test runs
        .route("/api/runs", get(get_runs).post(create_run))
        .route("/api/runs/:id", delete(delete_run))
        
        // Test suites
        .route("/api/suites", get(get_suites))
        
        // Executors
        .route("/api/executors", get(get_executors))
        
        // Add state and middleware
        .with_state(storage)
        .layer(
            ServiceBuilder::new()
                .layer(cors)
                .layer(middleware::from_fn(logging_middleware))
        );

    // Start the server
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3001")
        .await
        .expect("Failed to bind to address");
    
    info!("🌐 Server listening on http://127.0.0.1:3001");
    info!("💚 Health check: http://127.0.0.1:3001/health");
    info!("📡 API endpoints: http://127.0.0.1:3001/api/*");
    
    // Check if running in Kubernetes
    match std::env::var("KUBERNETES_SERVICE_HOST") {
        Ok(_) => info!("☸️  Kubernetes environment detected"),
        Err(_) => warn!("⚠️  Not running in Kubernetes - some features may be limited"),
    }

    axum::serve(listener, app)
        .await
        .expect("Failed to start server");

    Ok(())
}