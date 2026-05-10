use anyhow::{Context, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::process::Stdio;
use std::time::Duration;
use tokio::process::Command;
use tokio::time::sleep;

#[derive(Debug, Serialize)]
struct AgentRequest {
    name: String,
    version: String,
    status: String,
}

#[derive(Debug, Deserialize)]
struct QueueResponse {
    run: Option<TestRun>,
    definition: Option<TestDefinition>,
}

#[derive(Debug, Deserialize)]
struct TestRun {
    id: String,
    definition_id: Option<String>,
    status: String,
}

#[derive(Debug, Deserialize)]
struct TestDefinition {
    image: String,
    commands: Vec<String>,
}

#[derive(Debug, Serialize)]
struct RunStatusRequest {
    status: String,
    result: Option<Value>,
    error: Option<String>,
}

#[tokio::main]
async fn main() -> Result<()> {
    let api_url = std::env::var("SPARKTEST_CLOUD_URL")
        .unwrap_or_else(|_| "http://localhost:3001".to_string());
    let token =
        std::env::var("SPARKTEST_AGENT_TOKEN").context("SPARKTEST_AGENT_TOKEN is required")?;
    let name = std::env::var("SPARKTEST_AGENT_NAME").unwrap_or_else(|_| hostname());
    let once = std::env::var("SPARKTEST_AGENT_ONCE").ok().as_deref() == Some("1");
    let interval = std::env::var("SPARKTEST_AGENT_POLL_SECONDS")
        .ok()
        .and_then(|value| value.parse::<u64>().ok())
        .unwrap_or(5);
    let client = Client::new();

    loop {
        check_in(&client, &api_url, &token, &name).await?;
        let queue = next_run(&client, &api_url, &token, &name).await?;
        if let Some(run) = queue.run {
            execute_run(&client, &api_url, &token, run, queue.definition).await?;
        }

        if once {
            break;
        }
        sleep(Duration::from_secs(interval)).await;
    }

    Ok(())
}

async fn check_in(client: &Client, api_url: &str, token: &str, name: &str) -> Result<()> {
    client
        .post(format!("{api_url}/api/agent/check-in"))
        .bearer_auth(token)
        .json(&AgentRequest {
            name: name.to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            status: "online".to_string(),
        })
        .send()
        .await?
        .error_for_status()?;
    Ok(())
}

async fn next_run(
    client: &Client,
    api_url: &str,
    token: &str,
    name: &str,
) -> Result<QueueResponse> {
    let response = client
        .post(format!("{api_url}/api/agent/next-run"))
        .bearer_auth(token)
        .json(&AgentRequest {
            name: name.to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            status: "online".to_string(),
        })
        .send()
        .await?
        .error_for_status()?
        .json::<QueueResponse>()
        .await?;
    Ok(response)
}

async fn execute_run(
    client: &Client,
    api_url: &str,
    token: &str,
    run: TestRun,
    definition: Option<TestDefinition>,
) -> Result<()> {
    let command = definition
        .as_ref()
        .map(|definition| definition.commands.join(" && "))
        .filter(|command| !command.trim().is_empty())
        .unwrap_or_else(|| "echo sparktest agent execution".to_string());
    let output = if std::env::var("SPARKTEST_AGENT_EXECUTOR").ok().as_deref() == Some("kubernetes")
    {
        execute_kubernetes_job(&run, definition.as_ref(), &command).await
    } else {
        Command::new("sh")
            .arg("-lc")
            .arg(command)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
    };

    let (status, result, error) = match output {
        Ok(output) if output.status.success() => (
            "passed".to_string(),
            Some(serde_json::json!({
                "definition_id": run.definition_id,
                "previous_status": run.status,
                "stdout": String::from_utf8_lossy(&output.stdout),
            })),
            None,
        ),
        Ok(output) => (
            "failed".to_string(),
            Some(serde_json::json!({
                "definition_id": run.definition_id,
                "stdout": String::from_utf8_lossy(&output.stdout),
                "stderr": String::from_utf8_lossy(&output.stderr),
            })),
            Some(format!("process exited with {:?}", output.status.code())),
        ),
        Err(error) => ("error".to_string(), None, Some(error.to_string())),
    };

    client
        .post(format!("{api_url}/api/agent/runs/{}/status", run.id))
        .bearer_auth(token)
        .json(&RunStatusRequest {
            status,
            result,
            error,
        })
        .send()
        .await?
        .error_for_status()?;
    Ok(())
}

async fn execute_kubernetes_job(
    run: &TestRun,
    definition: Option<&TestDefinition>,
    command: &str,
) -> std::io::Result<std::process::Output> {
    let image = definition
        .map(|definition| definition.image.as_str())
        .unwrap_or("alpine:3.20");
    let job_suffix = run.id.replace('-', "").chars().take(24).collect::<String>();
    let job_name = format!("sparktest-{job_suffix}");
    let namespace =
        std::env::var("SPARKTEST_KUBE_NAMESPACE").unwrap_or_else(|_| "default".to_string());

    let create = Command::new("kubectl")
        .args([
            "-n", &namespace, "create", "job", &job_name, "--image", image, "--", "sh", "-lc",
            command,
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await?;
    if !create.status.success() {
        return Ok(create);
    }

    let wait = Command::new("kubectl")
        .args([
            "-n",
            &namespace,
            "wait",
            "--for=condition=complete",
            "--timeout=600s",
            &format!("job/{job_name}"),
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await?;
    let logs = Command::new("kubectl")
        .args(["-n", &namespace, "logs", &format!("job/{job_name}")])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await?;
    let _ = Command::new("kubectl")
        .args([
            "-n",
            &namespace,
            "delete",
            "job",
            &job_name,
            "--ignore-not-found=true",
        ])
        .output()
        .await;

    if wait.status.success() {
        Ok(logs)
    } else {
        Ok(wait)
    }
}

fn hostname() -> String {
    std::env::var("HOSTNAME").unwrap_or_else(|_| "sparktest-agent".to_string())
}
