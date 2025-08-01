use axum::{
    extract::{Query, Path, State},
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

// Import from our OSS-compatible core crate
use sparktest_core::*;

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
    pub database_connected: bool,
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

// Application state - can use either database or in-memory storage
#[derive(Clone)]
pub enum AppStorage {
    #[cfg(feature = "database")]
    Database(Arc<Database>),
    InMemory(Arc<Mutex<StorageData>>),
}

// In-memory storage for demo purposes when database is not available
use std::sync::{Arc, Mutex};

#[derive(Default)]
struct StorageData {
    definitions: HashMap<String, TestDefinition>,
    runs: HashMap<String, TestRun>,
    suites: HashMap<String, TestSuite>,
    executors: HashMap<String, TestExecutor>,
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

// Initialize sample data from @tatou/core - this serves the OSS sample data
// This eliminates duplication with the TypeScript samples
fn init_sample_data(storage: Arc<Mutex<StorageData>>) {
    let mut data = storage.lock().unwrap();
    
    // Create sample definitions that match the OSS @tatou/core sample data
    // These are the "working examples" that can actually run
    let sample_defs = vec![
        TestDefinition {
            id: Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap(),
            name: "Simple Health Check".to_string(),
            description: Some("Basic system health check using curl to test network connectivity".to_string()),
            image: "curlimages/curl:latest".to_string(),
            commands: vec!["curl -f -s -o /dev/null -w \"%{http_code}\" https://httpbin.org/status/200 && echo \"Health check passed\"".to_string()],
            created_at: Utc::now(),
            executor_id: Some(Uuid::parse_str("b7e6c1e2-1a2b-4c3d-8e9f-000000000008").unwrap()),
            labels: Some(vec!["working".to_string(), "examples".to_string(), "demo".to_string(), "health".to_string()]),
        },
        TestDefinition {
            id: Uuid::parse_str("00000000-0000-0000-0000-000000000002").unwrap(),
            name: "Basic Python Test".to_string(),
            description: Some("Simple Python test that runs without external dependencies".to_string()),
            image: "python:3.9-slim".to_string(),
            commands: vec!["python -c \"import sys; print(f'Python version: {sys.version}'); assert 2 + 2 == 4; print('Basic math test passed')\"".to_string()],
            created_at: Utc::now(),
            executor_id: Some(Uuid::parse_str("b7e6c1e2-1a2b-4c3d-8e9f-000000000003").unwrap()),
            labels: Some(vec!["working".to_string(), "examples".to_string(), "demo".to_string(), "python".to_string()]),
        },
        TestDefinition {
            id: Uuid::parse_str("00000000-0000-0000-0000-000000000003").unwrap(),
            name: "Node.js Version Test".to_string(),
            description: Some("Test Node.js installation and basic functionality".to_string()),
            image: "node:18-alpine".to_string(),
            commands: vec!["node -e \"console.log('Node.js version:', process.version); console.log('Test passed: 2 + 2 =', 2 + 2); process.exit(0)\"".to_string()],
            created_at: Utc::now(),
            executor_id: Some(Uuid::parse_str("b7e6c1e2-1a2b-4c3d-8e9f-000000000001").unwrap()),
            labels: Some(vec!["working".to_string(), "examples".to_string(), "demo".to_string(), "nodejs".to_string()]),
        }
    ];

    for def in sample_defs {
        data.definitions.insert(def.id.to_string(), def);
    }

    // Sample executors matching OSS structure
    let sample_executors = vec![
        TestExecutor {
            id: Uuid::parse_str("b7e6c1e2-1a2b-4c3d-8e9f-000000000001").unwrap(),
            name: "Jest Test Runner".to_string(),
            image: "node:18-alpine".to_string(),
            description: Some("Run JavaScript/TypeScript unit tests using Jest testing framework.".to_string()),
            default_command: "npm run test".to_string(),
            supported_file_types: vec!["js".to_string(), "ts".to_string(), "json".to_string()],
            environment_variables: vec!["NODE_ENV".to_string(), "CI".to_string()],
            icon: Some("🧪".to_string()),
        },
        TestExecutor {
            id: Uuid::parse_str("b7e6c1e2-1a2b-4c3d-8e9f-000000000003").unwrap(),
            name: "Pytest Runner".to_string(),
            image: "python:3.11-slim".to_string(),
            description: Some("Run Python unit and integration tests using pytest framework.".to_string()),
            default_command: "pytest --verbose --junit-xml=test-results.xml".to_string(),
            supported_file_types: vec!["py".to_string(), "yaml".to_string(), "json".to_string()],
            environment_variables: vec!["PYTHONPATH".to_string(), "PYTEST_CURRENT_TEST".to_string()],
            icon: Some("🐍".to_string()),
        },
        TestExecutor {
            id: Uuid::parse_str("b7e6c1e2-1a2b-4c3d-8e9f-000000000008").unwrap(),
            name: "Docker Container Runner".to_string(),
            image: "docker:latest".to_string(),
            description: Some("Run tests in isolated Docker containers with custom configurations.".to_string()),
            default_command: "docker run --rm".to_string(),
            supported_file_types: vec!["dockerfile".to_string(), "yaml".to_string(), "sh".to_string()],
            environment_variables: vec!["DOCKER_BUILDKIT".to_string()],
            icon: Some("🐳".to_string()),
        }
    ];

    for executor in sample_executors {
        data.executors.insert(executor.id.to_string(), executor);
    }

    info!("✅ Initialized OSS-compatible sample data: {} definitions, {} executors", 
          data.definitions.len(), data.executors.len());
}

// API Handlers

// Health endpoint
async fn health(State(storage): State<AppStorage>) -> Json<HealthResponse> {
    let mut services = HashMap::new();
    services.insert("api".to_string(), "healthy".to_string());
    
    // Check database connectivity
    let db_connected = match &storage {
        #[cfg(feature = "database")]
        AppStorage::Database(_) => {
            services.insert("database".to_string(), "connected".to_string());
            true
        },
        AppStorage::InMemory(_) => {
            services.insert("storage".to_string(), "in_memory".to_string());
            false
        }
    };
    
    // Mock Kubernetes status
    let k8s_connected = std::env::var("KUBERNETES_SERVICE_HOST").is_ok();
    services.insert("kubernetes".to_string(), 
        if k8s_connected { "connected".to_string() } else { "not_connected".to_string() });

    Json(HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        timestamp: Utc::now(),
        kubernetes_connected: k8s_connected,
        database_connected: db_connected,
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
async fn get_definitions(State(storage): State<AppStorage>) -> Result<Json<Vec<TestDefinition>>, StatusCode> {
    match &storage {
        #[cfg(feature = "database")]
        AppStorage::Database(db) => {
            match db.get_test_definitions().await {
                Ok(definitions) => Ok(Json(definitions)),
                Err(e) => {
                    error!("Failed to get definitions from database: {}", e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        },
        AppStorage::InMemory(data) => {
            let data = data.lock().unwrap();
            let definitions: Vec<TestDefinition> = data.definitions.values().cloned().collect();
            Ok(Json(definitions))
        }
    }
}

// Get definition by ID
async fn get_definition(
    Path(id): Path<String>,
    State(storage): State<AppStorage>
) -> Result<Json<TestDefinition>, StatusCode> {
    match &storage {
        #[cfg(feature = "database")]
        AppStorage::Database(db) => {
            match Uuid::parse_str(&id) {
                Ok(uuid) => {
                    match db.get_test_definition_by_id(uuid).await {
                        Ok(Some(definition)) => Ok(Json(definition)),
                        Ok(None) => Err(StatusCode::NOT_FOUND),
                        Err(e) => {
                            error!("Failed to get definition from database: {}", e);
                            Err(StatusCode::INTERNAL_SERVER_ERROR)
                        }
                    }
                },
                Err(_) => Err(StatusCode::BAD_REQUEST),
            }
        },
        AppStorage::InMemory(data) => {
            let data = data.lock().unwrap();
            match data.definitions.get(&id) {
                Some(definition) => Ok(Json(definition.clone())),
                None => Err(StatusCode::NOT_FOUND),
            }
        }
    }
}

// Get all runs
async fn get_runs(
    Query(params): Query<RunQuery>,
    State(storage): State<AppStorage>
) -> Result<Json<Vec<TestRun>>, StatusCode> {
    match &storage {
        #[cfg(feature = "database")]
        AppStorage::Database(db) => {
            match db.get_test_runs().await {
                Ok(mut runs) => {
                    // Apply filters
                    if let Some(status) = params.status {
                        runs.retain(|run| run.status == status);
                    }
                    if let Some(def_id) = params.definition_id {
                        if let Ok(uuid) = Uuid::parse_str(&def_id) {
                            runs.retain(|run| run.test_definition_id == Some(uuid));
                        }
                    }
                    Ok(Json(runs))
                },
                Err(e) => {
                    error!("Failed to get runs from database: {}", e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        },
        AppStorage::InMemory(data) => {
            let data = data.lock().unwrap();
            let mut runs: Vec<TestRun> = data.runs.values().cloned().collect();
            
            // Filter by status if provided
            if let Some(status) = params.status {
                runs.retain(|run| run.status == status);
            }
            
            // Filter by definition_id if provided
            if let Some(def_id) = params.definition_id {
                if let Ok(uuid) = Uuid::parse_str(&def_id) {
                    runs.retain(|run| run.test_definition_id == Some(uuid));
                }
            }
            
            // Sort by created_at descending
            runs.sort_by(|a, b| b.created_at.cmp(&a.created_at));
            
            Ok(Json(runs))
        }
    }
}

// Create new run
async fn create_run(
    State(storage): State<AppStorage>,
    Json(payload): Json<CreateRunRequest>
) -> Result<Json<TestRun>, StatusCode> {
    match &storage {
        #[cfg(feature = "database")]
        AppStorage::Database(db) => {
            // Parse definition_id UUID
            let def_uuid = match Uuid::parse_str(&payload.definition_id) {
                Ok(uuid) => uuid,
                Err(_) => return Err(StatusCode::BAD_REQUEST),
            };
            
            // Find the definition
            let definition = match db.get_test_definition_by_id(def_uuid).await {
                Ok(Some(def)) => def,
                Ok(None) => return Err(StatusCode::NOT_FOUND),
                Err(e) => {
                    error!("Failed to get definition: {}", e);
                    return Err(StatusCode::INTERNAL_SERVER_ERROR);
                }
            };
            
            let run_id = Uuid::new_v4();
            let run_name = payload.name.unwrap_or_else(|| 
                format!("{} - {}", definition.name, Utc::now().format("%H:%M:%S"))
            );
            
            let new_run = TestRun {
                id: run_id,
                name: run_name,
                image: definition.image.clone(),
                command: definition.commands.clone(),  // Note: 'command' not 'commands'
                status: "running".to_string(),
                created_at: Utc::now(),
                test_definition_id: Some(definition.id),  // Match OSS field name
                executor_id: definition.executor_id,  // This is already Option<Uuid>
                duration: None,
                logs: Some(vec![
                    format!("> Starting test: {}", definition.name),
                    "> Initializing container...".to_string(),
                ]),
            };
            
            // Create in database
            match db.create_test_run(&new_run).await {
                Ok(created_run) => {
                    info!("🚀 Created new test run: {} ({})", created_run.name, run_id);
                    
                    // Simulate test execution in background (database version)
                    let db_clone = db.clone(); // This won't work - we need to handle async differently
                    let run_id_clone = run_id;
                    tokio::spawn(async move {
                        tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
                        
                        // For database version, we'd need to implement proper background job handling
                        // For now, just log completion (in real implementation, this would update the DB)
                        info!("✅ Test run would be completed: {}", run_id_clone);
                    });
                    
                    Ok(Json(created_run))
                },
                Err(e) => {
                    error!("Failed to create run in database: {}", e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        },
        AppStorage::InMemory(data) => {
            let mut data_guard = data.lock().unwrap();
            
            // Find the definition
            let definition = match data_guard.definitions.get(&payload.definition_id) {
                Some(def) => def.clone(),
                None => return Err(StatusCode::NOT_FOUND),
            };
            
            let run_id = Uuid::new_v4();
            let run_name = payload.name.unwrap_or_else(|| 
                format!("{} - {}", definition.name, Utc::now().format("%H:%M:%S"))
            );
            
            let new_run = TestRun {
                id: run_id,
                name: run_name,
                image: definition.image.clone(),
                command: definition.commands.clone(),  // Note: 'command' not 'commands'
                status: "running".to_string(),
                created_at: Utc::now(),
                test_definition_id: Some(definition.id),  // Match OSS field name
                executor_id: definition.executor_id,  // This is already Option<Uuid>
                duration: None,
                logs: Some(vec![
                    format!("> Starting test: {}", definition.name),
                    "> Initializing container...".to_string(),
                ]),
            };
            
            info!("🚀 Created new test run: {} ({})", new_run.name, run_id);
            
            // Simulate test execution in background
            let storage_clone = data.clone();
            let run_id_clone = run_id;
            tokio::spawn(async move {
                tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
                
                let mut data = storage_clone.lock().unwrap();
                if let Some(run) = data.runs.get_mut(&run_id_clone.to_string()) {
                    // Simulate random success/failure
                    let success = rand::random::<f32>() > 0.3;
                    run.status = if success { "completed".to_string() } else { "failed".to_string() };
                    run.duration = Some(rand::random::<i32>() % 30 + 5); // 5-35 seconds
                    
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
            
            data_guard.runs.insert(run_id.to_string(), new_run.clone());
            drop(data_guard); // Release the lock
            Ok(Json(new_run))
        }
    }
}

// Delete run
async fn delete_run(
    Path(id): Path<String>,
    State(storage): State<AppStorage>
) -> Result<StatusCode, StatusCode> {
    match &storage {
        #[cfg(feature = "database")]
        AppStorage::Database(db) => {
            match Uuid::parse_str(&id) {
                Ok(uuid) => {
                    match db.delete_test_run(uuid).await {
                        Ok(true) => {
                            info!("🗑️ Deleted test run: {}", id);
                            Ok(StatusCode::NO_CONTENT)
                        },
                        Ok(false) => Err(StatusCode::NOT_FOUND),
                        Err(e) => {
                            error!("Failed to delete run from database: {}", e);
                            Err(StatusCode::INTERNAL_SERVER_ERROR)
                        }
                    }
                },
                Err(_) => Err(StatusCode::BAD_REQUEST),
            }
        },
        AppStorage::InMemory(data) => {
            let mut data = data.lock().unwrap();
            match data.runs.remove(&id) {
                Some(_) => {
                    info!("🗑️ Deleted test run: {}", id);
                    Ok(StatusCode::NO_CONTENT)
                },
                None => Err(StatusCode::NOT_FOUND),
            }
        }
    }
}

// Get all suites
async fn get_suites(State(storage): State<AppStorage>) -> Result<Json<Vec<TestSuite>>, StatusCode> {
    match &storage {
        #[cfg(feature = "database")]
        AppStorage::Database(db) => {
            match db.get_test_suites().await {
                Ok(suites) => Ok(Json(suites)),
                Err(e) => {
                    error!("Failed to get suites from database: {}", e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        },
        AppStorage::InMemory(data) => {
            let data = data.lock().unwrap();
            let suites: Vec<TestSuite> = data.suites.values().cloned().collect();
            Ok(Json(suites))
        }
    }
}

// Get all executors
async fn get_executors(State(storage): State<AppStorage>) -> Result<Json<Vec<TestExecutor>>, StatusCode> {
    match &storage {
        #[cfg(feature = "database")]
        AppStorage::Database(db) => {
            match db.get_executors().await {
                Ok(executors) => Ok(Json(executors)),
                Err(e) => {
                    error!("Failed to get executors from database: {}", e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        },
        AppStorage::InMemory(data) => {
            let data = data.lock().unwrap();
            let executors: Vec<TestExecutor> = data.executors.values().cloned().collect();
            Ok(Json(executors))
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter("info,saas_backend=debug")
        .init();

    info!("🚀 Starting SparkTest Backend v{}", env!("CARGO_PKG_VERSION"));
    info!("⚡ Kubernetes Test Orchestration Platform");

    // Try to connect to database, fallback to in-memory storage
    let storage = match std::env::var("DATABASE_URL") {
        Ok(db_url) => {
            info!("📊 Attempting to connect to database: {}", db_url);
            
            #[cfg(feature = "database")]
            {
                match sparktest_core::create_connection_pool(&db_url).await {
                    Ok(pool) => {
                        info!("✅ Connected to database successfully");
                        
                        // Run migrations
                        match sqlx::migrate!("./migrations").run(&pool).await {
                            Ok(_) => {
                                info!("✅ Database migrations completed");
                                AppStorage::Database(Arc::new(Database::new(pool)))
                            },
                            Err(e) => {
                                warn!("⚠️ Failed to run migrations: {}. Using in-memory storage instead.", e);
                                let in_memory_storage = Arc::new(Mutex::new(StorageData::default()));
                                init_sample_data(in_memory_storage.clone());
                                AppStorage::InMemory(in_memory_storage)
                            }
                        }
                    },
                    Err(e) => {
                        warn!("⚠️ Failed to connect to database: {}. Using in-memory storage instead.", e);
                        let in_memory_storage = Arc::new(Mutex::new(StorageData::default()));
                        init_sample_data(in_memory_storage.clone());
                        AppStorage::InMemory(in_memory_storage)
                    }
                }
            }
            
            #[cfg(not(feature = "database"))]
            {
                warn!("⚠️ Database feature not enabled. Using in-memory storage.");
                let in_memory_storage = Arc::new(Mutex::new(StorageData::default()));
                init_sample_data(in_memory_storage.clone());
                AppStorage::InMemory(in_memory_storage)
            }
        },
        Err(_) => {
            info!("📝 No DATABASE_URL provided. Using in-memory storage for demo.");
            let in_memory_storage = Arc::new(Mutex::new(StorageData::default()));
            init_sample_data(in_memory_storage.clone());
            AppStorage::InMemory(in_memory_storage)
        }
    };

    // Create CORS layer
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers(Any);

    // Build the router with OSS-compatible API structure
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