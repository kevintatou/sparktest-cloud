use axum::{
    response::Html,
    routing::get,
    Router,
};

#[tokio::main]
async fn main() {
    // Placeholder import from sparktest-core (commented out since it's fake)
    // use sparktest_core::SomeFunction;
    
    let app = Router::new()
        .route("/", get(handler))
        .route("/health", get(health_check));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3001")
        .await
        .unwrap();
        
    println!("SaaS Backend running on http://127.0.0.1:3001");
    axum::serve(listener, app).await.unwrap();
}

async fn handler() -> Html<&'static str> {
    Html("<h1>SaaS Backend - Rust Axum</h1>")
}

async fn health_check() -> Html<&'static str> {
    Html("<h1>OK</h1>")
}
