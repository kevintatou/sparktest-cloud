use axum::{
    http::Method,
    middleware,
    response::Json,
    routing::get,
    Router,
};
use serde::Serialize;
use std::collections::HashMap;
use tower::ServiceBuilder;
use tower_http::cors::{CorsLayer, Any};
use tracing::info;
use chrono::{DateTime, Utc};

// Health Check Response
#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
    timestamp: DateTime<Utc>,
    services: HashMap<String, String>,
}

// Middleware for logging
async fn logging_middleware(
    request: axum::extract::Request,
    next: axum::middleware::Next,
) -> axum::response::Response {
    let method = request.method().clone();
    let uri = request.uri().clone();
    
    info!("Received {} request to {}", method, uri);
    
    let response = next.run(request).await;
    
    info!("Responded with status: {}", response.status());
    
    response
}

// Health endpoint
async fn health() -> Json<HealthResponse> {
    let mut services = HashMap::new();
    services.insert("database".to_string(), "healthy".to_string());
    services.insert("cache".to_string(), "healthy".to_string());
    services.insert("external_api".to_string(), "healthy".to_string());

    Json(HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        timestamp: Utc::now(),
        services,
    })
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter("info,saas_backend=debug")
        .init();

    info!("Starting Tatou SaaS Backend v{}", env!("CARGO_PKG_VERSION"));

    // Create CORS layer
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers(Any);

    // Build the router
    let app = Router::new()
        // Health endpoint
        .route("/health", get(health))
        
        // Add middleware
        .layer(
            ServiceBuilder::new()
                .layer(cors)
                .layer(middleware::from_fn(logging_middleware))
        );

    // Start the server
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3001")
        .await
        .expect("Failed to bind to address");
    
    info!("Server listening on http://127.0.0.1:3001");
    info!("Health check available at http://127.0.0.1:3001/health");

    axum::serve(listener, app)
        .await
        .expect("Failed to start server");

    Ok(())
}