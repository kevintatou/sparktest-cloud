use sparktest_saas_api::create_app;
use sparktest_saas_core::Database;
use std::env;
use tokio::net::TcpListener;
use tracing::info;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let port = env::var("PORT").unwrap_or_else(|_| "3001".to_string());
    let addr = format!("0.0.0.0:{}", port);

    info!("Starting SparkTest SaaS API server on {}", addr);
    
    // Use in-memory database for now (placeholder implementation)
    let database = Database::new("placeholder").await?;
    
    // Seed sample data for development
    database.seed_sample_data().await?;
    info!("Seeded sample data");

    let app = create_app(database);
    let listener = TcpListener::bind(&addr).await?;
    
    info!("API server listening on {}", addr);
    axum::serve(listener, app).await?;
    
    Ok(())
}