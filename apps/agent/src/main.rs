use anyhow::{Context, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use std::process::Stdio;
use std::time::Duration;
use tokio::process::Command;
use tokio::time::sleep;

const DEFAULT_CLOUD_URL: &str = "https://sparktest-cloud-api.onrender.com";

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
    executor: Option<Executor>,
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

#[derive(Debug, Deserialize)]
struct Executor {
    executor_type: String,
    image: Option<String>,
    config: Option<Value>,
}

#[derive(Debug, Serialize)]
struct RunStatusRequest {
    status: String,
    result: Option<Value>,
    error: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
struct AgentConfig {
    cloud_url: String,
    token: String,
    name: Option<String>,
}

enum AgentCommand {
    Connect {
        token: String,
        cloud_url: String,
        name: Option<String>,
    },
    Run {
        once: bool,
    },
    Status,
    Version,
    Help,
    Disconnect,
}

#[tokio::main]
async fn main() -> Result<()> {
    match parse_command(std::env::args().skip(1).collect())? {
        AgentCommand::Connect {
            token,
            cloud_url,
            name,
        } => connect(&cloud_url, &token, name).await?,
        AgentCommand::Status => status().await?,
        AgentCommand::Version => println!("sparktest-agent {}", env!("CARGO_PKG_VERSION")),
        AgentCommand::Help => print_help(),
        AgentCommand::Disconnect => disconnect()?,
        AgentCommand::Run { once } => run_agent(once).await?,
    }
    Ok(())
}

async fn run_agent(once: bool) -> Result<()> {
    let config = load_config()?;
    let api_url = std::env::var("SPARKTEST_CLOUD_URL")
        .ok()
        .or_else(|| config.as_ref().map(|value| value.cloud_url.clone()))
        .unwrap_or_else(|| DEFAULT_CLOUD_URL.to_string());
    let token = std::env::var("SPARKTEST_AGENT_TOKEN")
        .ok()
        .or_else(|| config.as_ref().map(|value| value.token.clone()))
        .context("No agent token configured. Run `sparktest-agent connect <token>` first")?;
    let name = std::env::var("SPARKTEST_AGENT_NAME")
        .ok()
        .or_else(|| config.and_then(|value| value.name))
        .unwrap_or_else(|| hostname());
    let once = once || std::env::var("SPARKTEST_AGENT_ONCE").ok().as_deref() == Some("1");
    let interval = std::env::var("SPARKTEST_AGENT_POLL_SECONDS")
        .ok()
        .and_then(|value| value.parse::<u64>().ok())
        .unwrap_or(5);
    let client = Client::builder().timeout(Duration::from_secs(20)).build()?;

    let mut failures = 0u32;
    loop {
        let attempt = async {
            check_in(&client, &api_url, &token, &name).await?;
            let queue = next_run(&client, &api_url, &token, &name).await?;
            if let Some(run) = queue.run {
                let execution = execute_run(
                    &client,
                    &api_url,
                    &token,
                    run,
                    queue.definition,
                    queue.executor,
                );
                tokio::pin!(execution);
                let mut heartbeat = tokio::time::interval(Duration::from_secs(15));
                loop {
                    tokio::select! {
                        result = &mut execution => { result?; break; }
                        _ = heartbeat.tick() => {
                            if let Err(error) = check_in(&client, &api_url, &token, &name).await {
                                eprintln!("Heartbeat failed: {error}");
                            }
                        }
                    }
                }
            }
            Ok::<(), anyhow::Error>(())
        }
        .await;
        match attempt {
            Ok(()) => failures = 0,
            Err(error) => {
                if once || !retryable(&error) {
                    return Err(error);
                }
                failures = failures.saturating_add(1);
                eprintln!("Connection failed; retrying: {error}");
            }
        }
        if once {
            break;
        }
        let delay = if failures == 0 {
            interval.max(1)
        } else {
            (1u64 << failures.min(5)).min(30)
        };
        sleep(Duration::from_secs(delay)).await;
    }

    Ok(())
}

async fn connect(cloud_url: &str, token: &str, name: Option<String>) -> Result<()> {
    let client = Client::builder().timeout(Duration::from_secs(20)).build()?;
    let agent_name = name.unwrap_or_else(hostname);
    check_in(&client, cloud_url, token, &agent_name)
        .await
        .context("Could not authenticate agent token with SparkTest Cloud")?;
    save_config(&AgentConfig {
        cloud_url: cloud_url.trim_end_matches('/').to_string(),
        token: token.to_string(),
        name: Some(agent_name.clone()),
    })?;
    println!(
        "Connected {agent_name} to {}",
        cloud_url.trim_end_matches('/')
    );
    println!("Configuration saved. Run `sparktest-agent run` to start polling.");
    Ok(())
}

async fn status() -> Result<()> {
    let config = load_config()?.context("No agent is connected")?;
    let client = Client::builder().timeout(Duration::from_secs(20)).build()?;
    let name = config.name.clone().unwrap_or_else(hostname);
    check_in(&client, &config.cloud_url, &config.token, &name).await?;
    println!("Agent {name} is online at {}", config.cloud_url);
    Ok(())
}

fn disconnect() -> Result<()> {
    let path = config_path()?;
    if path.exists() {
        fs::remove_file(path)?;
        println!("Agent disconnected.");
    } else {
        println!("No agent configuration found.");
    }
    Ok(())
}

fn parse_command(args: Vec<String>) -> Result<AgentCommand> {
    let Some(command) = args.first().map(String::as_str) else {
        if std::env::var("SPARKTEST_AGENT_TOKEN").is_ok() {
            return Ok(AgentCommand::Run { once: false });
        }
        return Ok(AgentCommand::Run { once: false });
    };

    match command {
        "connect" => {
            let token = args
                .get(1)
                .context("Usage: sparktest-agent connect <token>")?;
            let mut cloud_url = std::env::var("SPARKTEST_CLOUD_URL")
                .unwrap_or_else(|_| DEFAULT_CLOUD_URL.to_string());
            let mut name = std::env::var("SPARKTEST_AGENT_NAME").ok();
            let mut index = 2;
            while index < args.len() {
                match args[index].as_str() {
                    "--url" => {
                        index += 1;
                        cloud_url = args.get(index).context("--url requires a value")?.clone();
                    }
                    "--name" => {
                        index += 1;
                        name = Some(args.get(index).context("--name requires a value")?.clone());
                    }
                    value => anyhow::bail!("Unknown connect option: {value}"),
                }
                index += 1;
            }
            Ok(AgentCommand::Connect {
                token: token.clone(),
                cloud_url,
                name,
            })
        }
        "run" => Ok(AgentCommand::Run {
            once: args.iter().any(|arg| arg == "--once"),
        }),
        "status" => Ok(AgentCommand::Status),
        "version" | "--version" | "-V" => Ok(AgentCommand::Version),
        "disconnect" => Ok(AgentCommand::Disconnect),
        "--help" | "-h" => Ok(AgentCommand::Help),
        value => anyhow::bail!("Unknown command: {value}. Use --help for usage."),
    }
}

fn print_help() {
    println!(
        "sparktest-agent connect <token> [--url <url>] [--name <name>]\n\
         sparktest-agent run [--once]\n\
         sparktest-agent status\n\
         sparktest-agent version\n\
         sparktest-agent disconnect"
    );
}

fn config_path() -> Result<PathBuf> {
    #[cfg(target_os = "windows")]
    let base = std::env::var_os("APPDATA").map(PathBuf::from);
    #[cfg(not(target_os = "windows"))]
    let base = std::env::var_os("XDG_CONFIG_HOME")
        .map(PathBuf::from)
        .or_else(|| std::env::var_os("HOME").map(|home| PathBuf::from(home).join(".config")));
    base.map(|path| path.join("sparktest").join("agent.json"))
        .context("Could not determine a user config directory")
}

fn load_config() -> Result<Option<AgentConfig>> {
    let path = config_path()?;
    if !path.exists() {
        return Ok(None);
    }
    Ok(Some(serde_json::from_str(&fs::read_to_string(path)?)?))
}

fn save_config(config: &AgentConfig) -> Result<()> {
    let path = config_path()?;
    let directory = path.parent().context("Invalid agent config path")?;
    fs::create_dir_all(directory)?;
    fs::write(&path, serde_json::to_vec_pretty(config)?)?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&path, fs::Permissions::from_mode(0o600))?;
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
    executor: Option<Executor>,
) -> Result<()> {
    let command = definition
        .as_ref()
        .map(|definition| definition.commands.join(" && "))
        .filter(|command| !command.trim().is_empty())
        .or_else(|| executor.as_ref().and_then(default_command))
        .unwrap_or_else(|| "echo sparktest agent execution".to_string());
    let env_executor_type = std::env::var("SPARKTEST_AGENT_EXECUTOR").ok();
    let executor_type = executor
        .as_ref()
        .map(|item| item.executor_type.as_str())
        .or(env_executor_type.as_deref())
        .unwrap_or("local");
    let output = if executor_type == "kubernetes" {
        execute_kubernetes_job(&run, definition.as_ref(), executor.as_ref(), &command).await
    } else if executor_type == "docker" {
        execute_docker(&definition, executor.as_ref(), &command).await
    } else {
        let mut process = Command::new("sh");
        process.arg("-lc").arg(command);
        bounded_output(&mut process, Duration::from_secs(600)).await
    };

    let (status, result, error) = match output {
        Ok(output) if output.status.success() => (
            "passed".to_string(),
            Some(serde_json::json!({
                "definition_id": run.definition_id,
                "previous_status": run.status,
                "stdout": String::from_utf8_lossy(&output.stdout),
                "stderr": String::from_utf8_lossy(&output.stderr),
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

    let report = RunStatusRequest {
        status,
        result,
        error,
    };
    let mut failures = 0u32;
    loop {
        let response = client
            .post(format!("{api_url}/api/agent/runs/{}/status", run.id))
            .bearer_auth(token)
            .json(&report)
            .send()
            .await
            .and_then(|response| response.error_for_status());
        match response {
            Ok(_) => break,
            Err(error) => {
                let error = anyhow::Error::from(error);
                if !retryable(&error) {
                    return Err(error);
                }
                failures = failures.saturating_add(1);
                eprintln!("Result upload failed; retaining result and retrying: {error}");
                sleep(Duration::from_secs((1u64 << failures.min(5)).min(30))).await;
            }
        }
    }

    Ok(())
}

async fn execute_docker(
    definition: &Option<TestDefinition>,
    executor: Option<&Executor>,
    command: &str,
) -> std::io::Result<std::process::Output> {
    let image = executor
        .and_then(|item| item.image.as_deref())
        .or_else(|| definition.as_ref().map(|item| item.image.as_str()))
        .unwrap_or("alpine:3.20");
    let container_name = format!(
        "sparktest-agent-{}-{}",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos()
    );
    let mut process = Command::new("docker");
    process.args([
        "run",
        "--rm",
        "--name",
        &container_name,
        image,
        "sh",
        "-lc",
        command,
    ]);
    let result = bounded_output(&mut process, Duration::from_secs(600)).await;
    if result.is_err() {
        let mut cleanup = Command::new("docker");
        cleanup.args(["rm", "-f", &container_name]);
        let _ = bounded_output(&mut cleanup, Duration::from_secs(15)).await;
    }
    result
}

async fn execute_kubernetes_job(
    run: &TestRun,
    definition: Option<&TestDefinition>,
    executor: Option<&Executor>,
    command: &str,
) -> std::io::Result<std::process::Output> {
    let image = executor
        .and_then(|executor| executor.image.as_deref())
        .or_else(|| definition.map(|definition| definition.image.as_str()))
        .unwrap_or("alpine:3.20");
    let job_suffix = run.id.replace('-', "").chars().take(24).collect::<String>();
    let job_name = format!("sparktest-{job_suffix}");
    let namespace =
        std::env::var("SPARKTEST_KUBE_NAMESPACE").unwrap_or_else(|_| "default".to_string());

    let mut create_command = Command::new("kubectl");
    create_command.args([
        "-n", &namespace, "create", "job", &job_name, "--image", image, "--", "sh", "-lc", command,
    ]);
    let create = bounded_output(&mut create_command, Duration::from_secs(20)).await;
    if let Ok(ref output) = create {
        if !output.status.success() {
            return create;
        }
    }
    let execution = async {
        create?;
        let mut wait_command = Command::new("kubectl");
        wait_command.args([
            "-n",
            &namespace,
            "wait",
            "--for=condition=complete",
            "--timeout=600s",
            &format!("job/{job_name}"),
        ]);
        let wait = bounded_output(&mut wait_command, Duration::from_secs(610)).await?;
        let mut logs_command = Command::new("kubectl");
        logs_command.args(["-n", &namespace, "logs", &format!("job/{job_name}")]);
        let logs = bounded_output(&mut logs_command, Duration::from_secs(20)).await?;
        Ok::<_, std::io::Error>((wait, logs))
    }
    .await;
    let mut cleanup = Command::new("kubectl");
    cleanup.args([
        "-n",
        &namespace,
        "delete",
        "job",
        &job_name,
        "--ignore-not-found=true",
        "--wait=false",
    ]);
    let _ = bounded_output(&mut cleanup, Duration::from_secs(20)).await;
    let (wait, logs) = execution?;

    if wait.status.success() {
        Ok(logs)
    } else {
        Ok(wait)
    }
}

fn default_command(executor: &Executor) -> Option<String> {
    executor
        .config
        .as_ref()
        .and_then(|config| config.get("default_command"))
        .and_then(Value::as_array)
        .map(|parts| {
            parts
                .iter()
                .filter_map(Value::as_str)
                .collect::<Vec<_>>()
                .join(" ")
        })
        .filter(|command| !command.trim().is_empty())
}

fn hostname() -> String {
    std::env::var("HOSTNAME").unwrap_or_else(|_| "sparktest-agent".to_string())
}

fn retryable(error: &anyhow::Error) -> bool {
    error
        .downcast_ref::<reqwest::Error>()
        .map(|error| {
            error
                .status()
                .map(|status| {
                    status.is_server_error() || status.as_u16() == 429 || status.as_u16() == 408
                })
                .unwrap_or(true)
        })
        .unwrap_or(false)
}

async fn bounded_output(
    command: &mut Command,
    limit: Duration,
) -> std::io::Result<std::process::Output> {
    command
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true);
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        command.as_std_mut().process_group(0);
    }
    let child = command.spawn()?;
    let pid = child.id();
    match tokio::time::timeout(limit, child.wait_with_output()).await {
        Ok(result) => result,
        Err(_) => {
            #[cfg(unix)]
            if let Some(pid) = pid {
                // Kill descendants too: dropping the child only kills the shell.
                let _ = Command::new("kill")
                    .args(["-KILL", "--", &format!("-{pid}")])
                    .status()
                    .await;
            }
            Err(std::io::Error::new(
                std::io::ErrorKind::TimedOut,
                "Execution exceeded its time limit",
            ))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn result_delivery_retries_a_server_failure_with_the_same_result() {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let url = format!("http://{}", listener.local_addr().unwrap());
        let server = tokio::spawn(async move {
            let mut bodies = Vec::new();
            for status in ["503 Service Unavailable", "200 OK"] {
                let (mut socket, _) = listener.accept().await.unwrap();
                let mut request = Vec::new();
                let body = loop {
                    let mut buffer = [0; 4096];
                    let count = socket.read(&mut buffer).await.unwrap();
                    assert!(count > 0);
                    request.extend_from_slice(&buffer[..count]);
                    if let Some(end) = request.windows(4).position(|part| part == b"\r\n\r\n") {
                        let headers = String::from_utf8_lossy(&request[..end]).to_lowercase();
                        let length: usize = headers
                            .lines()
                            .find_map(|line| line.strip_prefix("content-length: "))
                            .unwrap()
                            .parse()
                            .unwrap();
                        if request.len() >= end + 4 + length {
                            break request[end + 4..end + 4 + length].to_vec();
                        }
                    }
                };
                bodies.push(body);
                socket
                    .write_all(
                        format!(
                            "HTTP/1.1 {status}\r\nContent-Length: 0\r\nConnection: close\r\n\r\n"
                        )
                        .as_bytes(),
                    )
                    .await
                    .unwrap();
            }
            assert_eq!(bodies[0], bodies[1]);
            let result: Value = serde_json::from_slice(&bodies[1]).unwrap();
            assert_eq!(result["status"], "passed");
            assert!(result["result"]["stdout"]
                .as_str()
                .unwrap()
                .contains("connected"));
        });
        let run = TestRun {
            id: "test".into(),
            definition_id: None,
            status: "running".into(),
        };
        let definition = TestDefinition {
            image: "alpine:3.20".into(),
            commands: vec!["echo connected".into()],
        };
        tokio::time::timeout(
            Duration::from_secs(10),
            execute_run(
                &Client::new(),
                &url,
                "test-token",
                run,
                Some(definition),
                None,
            ),
        )
        .await
        .unwrap()
        .unwrap();
        server.await.unwrap();
    }

    #[tokio::test]
    async fn shell_example_succeeds_and_preserves_output() {
        let mut command = Command::new("sh");
        command.args(["-lc", "echo 'SparkTest connected'"]);
        let result = bounded_output(&mut command, Duration::from_secs(2))
            .await
            .unwrap();
        assert!(result.status.success());
        assert!(String::from_utf8_lossy(&result.stdout).contains("SparkTest connected"));
    }

    #[tokio::test]
    async fn hung_command_times_out() {
        let mut command = Command::new("sh");
        command.args(["-c", "sleep 30"]);
        let result = bounded_output(&mut command, Duration::from_millis(50))
            .await
            .unwrap_err();
        assert_eq!(result.kind(), std::io::ErrorKind::TimedOut);
    }
}
