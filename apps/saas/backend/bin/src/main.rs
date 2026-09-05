use sparktest_saas_api::create_app;
use sparktest_saas_core::{spawn_retention_pruner, spawn_scheduler, Database};
use std::env;
use std::time::Duration;
use tokio::net::TcpListener;
use tracing::info;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let port = env::var("PORT").unwrap_or_else(|_| "3001".to_string());
    let addr = format!("0.0.0.0:{}", port);

    info!("Starting SparkTest SaaS API server on {}", addr);

    let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| "memory://local".to_string());
    let database = Database::new(&database_url).await?;

    info!("Starting scheduled-runs poller");
    spawn_scheduler(database.clone(), Duration::from_secs(30));

    info!("Starting retention pruner");
    spawn_retention_pruner(database.clone(), Duration::from_secs(3600));

    let recovery_db = database.clone();
    tokio::spawn(async move {
        let mut timer = tokio::time::interval(Duration::from_secs(30));
        loop {
            timer.tick().await;
            if let Err(error) = recovery_db.expire_abandoned_runs().await {
                tracing::error!(%error, "Could not expire abandoned runs");
            }
        }
    });

    let app = create_app(database);
    let listener = TcpListener::bind(&addr).await?;

    info!("API server listening on {}", addr);
    axum::serve(listener, app).await?;

    Ok(())
}
