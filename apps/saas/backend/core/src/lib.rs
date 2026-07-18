use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{postgres::PgPoolOptions, types::Json, PgPool};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::sync::{Arc, Mutex};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Profile {
    pub id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Project {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ProjectMember {
    pub project_id: Uuid,
    pub profile_id: Uuid,
    pub role: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestDefinition {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub image: String,
    pub commands: Vec<String>,
    pub executor_id: Option<Uuid>,
    pub labels: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestRun {
    pub id: Uuid,
    pub project_id: Uuid,
    pub definition_id: Option<Uuid>,
    pub suite_id: Option<Uuid>,
    pub executor_id: Option<Uuid>,
    pub agent_id: Option<Uuid>,
    pub status: String,
    pub result: Option<Value>,
    pub error: Option<String>,
    pub queued_at: DateTime<Utc>,
    pub started_at: Option<DateTime<Utc>>,
    pub finished_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Schedule {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub definition_id: Option<Uuid>,
    pub suite_id: Option<Uuid>,
    pub cron_expression: String,
    pub timezone: String,
    pub enabled: bool,
    pub last_run_at: Option<DateTime<Utc>>,
    pub next_run_at: Option<DateTime<Utc>>,
    pub run_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Webhook {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub url: String,
    pub secret_hash: Option<String>,
    pub events: Vec<String>,
    pub enabled: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct WebhookDelivery {
    pub id: Uuid,
    pub webhook_id: Uuid,
    pub event: String,
    pub payload: Value,
    pub response_status: Option<i32>,
    pub response_body: Option<String>,
    pub duration_ms: Option<i32>,
    pub success: bool,
    pub attempt: i32,
    pub delivered_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Executor {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub executor_type: String,
    pub image: Option<String>,
    pub config: Value,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestSuite {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub test_definition_ids: Vec<Uuid>,
    pub execution_mode: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AgentToken {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub token_hash: String,
    pub last_used_at: Option<DateTime<Utc>>,
    pub revoked_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentTokenCreated {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub token: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Agent {
    pub id: Uuid,
    pub project_id: Uuid,
    pub token_id: Option<Uuid>,
    pub name: String,
    pub version: Option<String>,
    pub status: String,
    pub last_seen_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Plan {
    pub id: Uuid,
    pub slug: String,
    pub price_cents: i32,
    pub features: Value,
    pub stripe_price_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrgSubscription {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub stripe_subscription_id: String,
    pub status: String,
    pub current_period_end: DateTime<Utc>,
    pub plan_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub type SaasTestDefinition = TestDefinition;
pub type SaasTestRun = TestRun;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Organization {
    pub id: Uuid,
    pub name: String,
    pub stripe_customer_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(sqlx::FromRow)]
struct TestDefinitionRow {
    id: Uuid,
    project_id: Uuid,
    name: String,
    description: Option<String>,
    image: String,
    commands: Json<Vec<String>>,
    executor_id: Option<Uuid>,
    labels: Json<Vec<String>>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl From<TestDefinitionRow> for TestDefinition {
    fn from(row: TestDefinitionRow) -> Self {
        Self {
            id: row.id,
            project_id: row.project_id,
            name: row.name,
            description: row.description,
            image: row.image,
            commands: row.commands.0,
            executor_id: row.executor_id,
            labels: row.labels.0,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

#[derive(sqlx::FromRow)]
struct TestSuiteRow {
    id: Uuid,
    project_id: Uuid,
    name: String,
    description: Option<String>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[derive(sqlx::FromRow)]
struct TestRunRow {
    id: Uuid,
    project_id: Uuid,
    definition_id: Option<Uuid>,
    suite_id: Option<Uuid>,
    executor_id: Option<Uuid>,
    agent_id: Option<Uuid>,
    status: String,
    result: Option<Value>,
    error: Option<String>,
    queued_at: DateTime<Utc>,
    started_at: Option<DateTime<Utc>>,
    finished_at: Option<DateTime<Utc>>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl From<TestRunRow> for TestRun {
    fn from(row: TestRunRow) -> Self {
        Self {
            id: row.id,
            project_id: row.project_id,
            definition_id: row.definition_id,
            suite_id: row.suite_id,
            executor_id: row.executor_id,
            agent_id: row.agent_id,
            status: row.status,
            result: row.result,
            error: row.error,
            queued_at: row.queued_at,
            started_at: row.started_at,
            finished_at: row.finished_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

#[derive(Default)]
struct Store {
    profiles: Vec<Profile>,
    projects: Vec<Project>,
    members: Vec<ProjectMember>,
    definitions: Vec<TestDefinition>,
    runs: Vec<TestRun>,
    executors: Vec<Executor>,
    suites: Vec<TestSuite>,
    agent_tokens: Vec<AgentToken>,
    agents: Vec<Agent>,
    plans: Vec<Plan>,
    organizations: Vec<Organization>,
    subscriptions: Vec<OrgSubscription>,
    schedules: Vec<Schedule>,
    webhooks: Vec<Webhook>,
    webhook_deliveries: Vec<WebhookDelivery>,
}

#[derive(Clone)]
pub struct Database {
    store: Arc<Mutex<Store>>,
    pool: Option<PgPool>,
    default_project_id: Uuid,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self, anyhow::Error> {
        let default_project_id = Uuid::new_v4();
        let now = Utc::now();
        let mut store = Store::default();
        store.projects.push(Project {
            id: default_project_id,
            name: "Default Project".to_string(),
            slug: "default".to_string(),
            created_at: now,
            updated_at: now,
        });
        store.plans = default_plans();

        let pool = if database_url.starts_with("postgres://")
            || database_url.starts_with("postgresql://")
        {
            let pool = PgPoolOptions::new()
                .max_connections(5)
                .connect(database_url)
                .await?;
            sqlx::query(
                r#"
                insert into projects (id, name, slug)
                values ($1, 'Default Project', 'default')
                on conflict (slug) do update set updated_at = now()
                "#,
            )
            .bind(default_project_id)
            .execute(&pool)
            .await?;
            Some(pool)
        } else {
            None
        };

        let default_project_id = if let Some(pool) = &pool {
            sqlx::query_scalar::<_, Uuid>("select id from projects where slug = 'default'")
                .fetch_one(pool)
                .await?
        } else {
            default_project_id
        };

        Ok(Self {
            store: Arc::new(Mutex::new(store)),
            pool,
            default_project_id,
        })
    }

    pub fn default_project_id(&self) -> Uuid {
        self.default_project_id
    }

    pub async fn ensure_profile(
        &self,
        id: Uuid,
        email: String,
        name: Option<String>,
    ) -> Result<Profile, anyhow::Error> {
        if let Some(pool) = &self.pool {
            let profile = sqlx::query_as::<_, Profile>(
                r#"
                insert into profiles (id, email, name)
                values ($1, $2, $3)
                on conflict (id) do update set email = excluded.email, name = excluded.name, updated_at = now()
                returning id, email, name, created_at, updated_at
                "#,
            )
            .bind(id)
            .bind(&email)
            .bind(&name)
            .fetch_one(pool)
            .await?;
            sqlx::query(
                r#"
                insert into project_members (project_id, profile_id, role)
                values ($1, $2, 'owner')
                on conflict (project_id, profile_id) do nothing
                "#,
            )
            .bind(self.default_project_id)
            .bind(id)
            .execute(pool)
            .await?;
            return Ok(profile);
        }

        let now = Utc::now();
        let mut store = self.store.lock().unwrap();
        if let Some(profile) = store.profiles.iter_mut().find(|p| p.id == id) {
            profile.email = email;
            profile.name = name;
            profile.updated_at = now;
            return Ok(profile.clone());
        }

        let profile = Profile {
            id,
            email,
            name,
            created_at: now,
            updated_at: now,
        };
        store.profiles.push(profile.clone());
        if !store
            .members
            .iter()
            .any(|m| m.profile_id == id && m.project_id == self.default_project_id)
        {
            store.members.push(ProjectMember {
                project_id: self.default_project_id,
                profile_id: id,
                role: "owner".to_string(),
                created_at: now,
            });
        }
        Ok(profile)
    }

    pub async fn list_projects(
        &self,
        profile_id: Option<Uuid>,
    ) -> Result<Vec<Project>, anyhow::Error> {
        if let Some(pool) = &self.pool {
            if let Some(profile_id) = profile_id {
                return Ok(sqlx::query_as::<_, Project>(
                    r#"
                    select p.id, p.name, p.slug, p.created_at, p.updated_at
                    from projects p
                    join project_members m on m.project_id = p.id
                    where m.profile_id = $1
                    order by p.created_at desc
                    "#,
                )
                .bind(profile_id)
                .fetch_all(pool)
                .await?);
            }
            return Ok(sqlx::query_as::<_, Project>(
                "select id, name, slug, created_at, updated_at from projects order by created_at desc",
            )
            .fetch_all(pool)
            .await?);
        }

        let store = self.store.lock().unwrap();
        if let Some(profile_id) = profile_id {
            let project_ids: Vec<Uuid> = store
                .members
                .iter()
                .filter(|m| m.profile_id == profile_id)
                .map(|m| m.project_id)
                .collect();
            return Ok(store
                .projects
                .iter()
                .filter(|p| project_ids.contains(&p.id))
                .cloned()
                .collect());
        }
        Ok(store.projects.clone())
    }

    pub async fn count_projects(&self) -> Result<usize, anyhow::Error> {
        if let Some(pool) = &self.pool {
            let count = sqlx::query_scalar::<_, i64>("select count(*) from projects")
                .fetch_one(pool)
                .await?;
            return Ok(count as usize);
        }

        let store = self.store.lock().unwrap();
        Ok(store.projects.len())
    }

    pub async fn create_project(
        &self,
        mut project: Project,
        owner_id: Option<Uuid>,
    ) -> Result<Project, anyhow::Error> {
        if let Some(pool) = &self.pool {
            let slug = slugify(&project.name);
            let created = sqlx::query_as::<_, Project>(
                r#"
                insert into projects (name, slug)
                values ($1, $2)
                returning id, name, slug, created_at, updated_at
                "#,
            )
            .bind(&project.name)
            .bind(&slug)
            .fetch_one(pool)
            .await?;
            if let Some(owner_id) = owner_id {
                sqlx::query(
                    r#"
                    insert into project_members (project_id, profile_id, role)
                    values ($1, $2, 'owner')
                    on conflict (project_id, profile_id) do nothing
                    "#,
                )
                .bind(created.id)
                .bind(owner_id)
                .execute(pool)
                .await?;
            }
            return Ok(created);
        }

        let now = Utc::now();
        project.id = Uuid::new_v4();
        project.slug = slugify(&project.name);
        project.created_at = now;
        project.updated_at = now;
        let mut store = self.store.lock().unwrap();
        store.projects.push(project.clone());
        if let Some(owner_id) = owner_id {
            store.members.push(ProjectMember {
                project_id: project.id,
                profile_id: owner_id,
                role: "owner".to_string(),
                created_at: now,
            });
        }
        Ok(project)
    }

    pub async fn list_project_members(
        &self,
        project_id: Uuid,
    ) -> Result<Vec<ProjectMember>, anyhow::Error> {
        if let Some(pool) = &self.pool {
            return Ok(sqlx::query_as::<_, ProjectMember>(
                "select project_id, profile_id, role, created_at from project_members where project_id = $1",
            )
            .bind(project_id)
            .fetch_all(pool)
            .await?);
        }

        let store = self.store.lock().unwrap();
        Ok(store
            .members
            .iter()
            .filter(|m| m.project_id == project_id)
            .cloned()
            .collect())
    }

    pub async fn has_project_access(
        &self,
        project_id: Uuid,
        profile_id: Option<Uuid>,
    ) -> Result<bool, anyhow::Error> {
        if let Some(pool) = &self.pool {
            let Some(profile_id) = profile_id else {
                return Ok(project_id == self.default_project_id);
            };
            let count = sqlx::query_scalar::<_, i64>(
                "select count(*) from project_members where project_id = $1 and profile_id = $2",
            )
            .bind(project_id)
            .bind(profile_id)
            .fetch_one(pool)
            .await?;
            return Ok(count > 0);
        }

        let Some(profile_id) = profile_id else {
            return Ok(project_id == self.default_project_id);
        };
        let store = self.store.lock().unwrap();
        Ok(store
            .members
            .iter()
            .any(|m| m.project_id == project_id && m.profile_id == profile_id))
    }

    pub async fn create_test_definition(
        &self,
        definition: &TestDefinition,
    ) -> Result<(), anyhow::Error> {
        if let Some(pool) = &self.pool {
            sqlx::query(
                r#"
                insert into test_definitions
                  (id, project_id, name, description, image, commands, executor_id, labels, created_at, updated_at)
                values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                "#,
            )
            .bind(definition.id)
            .bind(definition.project_id)
            .bind(&definition.name)
            .bind(&definition.description)
            .bind(&definition.image)
            .bind(Json(&definition.commands))
            .bind(definition.executor_id)
            .bind(Json(&definition.labels))
            .bind(definition.created_at)
            .bind(definition.updated_at)
            .execute(pool)
            .await?;
            return Ok(());
        }

        let mut store = self.store.lock().unwrap();
        store.definitions.push(definition.clone());
        Ok(())
    }

    pub async fn update_test_definition(
        &self,
        definition: &TestDefinition,
    ) -> Result<(), anyhow::Error> {
        if let Some(pool) = &self.pool {
            sqlx::query(
                r#"
                update test_definitions
                set name = $2, description = $3, image = $4, commands = $5, executor_id = $6, labels = $7, updated_at = $8
                where id = $1
                "#,
            )
            .bind(definition.id)
            .bind(&definition.name)
            .bind(&definition.description)
            .bind(&definition.image)
            .bind(Json(&definition.commands))
            .bind(definition.executor_id)
            .bind(Json(&definition.labels))
            .bind(definition.updated_at)
            .execute(pool)
            .await?;
            return Ok(());
        }

        let mut store = self.store.lock().unwrap();
        if let Some(existing) = store.definitions.iter_mut().find(|d| d.id == definition.id) {
            *existing = definition.clone();
        }
        Ok(())
    }

    pub async fn get_test_definition(
        &self,
        id: Uuid,
    ) -> Result<Option<TestDefinition>, anyhow::Error> {
        if let Some(pool) = &self.pool {
            return Ok(sqlx::query_as::<_, TestDefinitionRow>(
                r#"
                select id, project_id, name, description, image, commands, executor_id, labels, created_at, updated_at
                from test_definitions where id = $1
                "#,
            )
            .bind(id)
            .fetch_optional(pool)
            .await?
            .map(Into::into));
        }

        let store = self.store.lock().unwrap();
        Ok(store.definitions.iter().find(|d| d.id == id).cloned())
    }

    pub async fn list_test_definitions(
        &self,
        project_id: Option<Uuid>,
        _profile_id: Option<Uuid>,
    ) -> Result<Vec<TestDefinition>, anyhow::Error> {
        let project_id = project_id.unwrap_or(self.default_project_id);
        if let Some(pool) = &self.pool {
            return Ok(sqlx::query_as::<_, TestDefinitionRow>(
                r#"
                select id, project_id, name, description, image, commands, executor_id, labels, created_at, updated_at
                from test_definitions where project_id = $1 order by created_at desc
                "#,
            )
            .bind(project_id)
            .fetch_all(pool)
            .await?
            .into_iter()
            .map(Into::into)
            .collect());
        }

        let store = self.store.lock().unwrap();
        Ok(store
            .definitions
            .iter()
            .filter(|d| d.project_id == project_id)
            .cloned()
            .collect())
    }

    pub async fn delete_test_definition(&self, id: Uuid) -> Result<(), anyhow::Error> {
        if let Some(pool) = &self.pool {
            sqlx::query("delete from test_definitions where id = $1")
                .bind(id)
                .execute(pool)
                .await?;
            return Ok(());
        }

        let mut store = self.store.lock().unwrap();
        store.definitions.retain(|d| d.id != id);
        Ok(())
    }

    pub async fn create_test_run(&self, run: &TestRun) -> Result<(), anyhow::Error> {
        if let Some(pool) = &self.pool {
            sqlx::query(
                r#"
                insert into test_runs
                  (id, project_id, definition_id, suite_id, executor_id, agent_id, status, result, error, queued_at, started_at, finished_at, created_at, updated_at)
                values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                "#,
            )
            .bind(run.id)
            .bind(run.project_id)
            .bind(run.definition_id)
            .bind(run.suite_id)
            .bind(run.executor_id)
            .bind(run.agent_id)
            .bind(&run.status)
            .bind(&run.result)
            .bind(&run.error)
            .bind(run.queued_at)
            .bind(run.started_at)
            .bind(run.finished_at)
            .bind(run.created_at)
            .bind(run.updated_at)
            .execute(pool)
            .await?;
            return Ok(());
        }

        let mut store = self.store.lock().unwrap();
        store.runs.push(run.clone());
        Ok(())
    }

    // Schedules with a due next_run_at are claimed one at a time with
    // `for update skip locked` (same pattern as claim_next_run) so multiple
    // backend instances polling concurrently don't double-fire the same
    // schedule. Claiming stamps updated_at immediately; the caller advances
    // last_run_at/next_run_at/run_count via mark_schedule_fired once the run
    // is actually created.
    pub async fn claim_due_schedules(&self, limit: i64) -> Result<Vec<Schedule>, anyhow::Error> {
        if let Some(pool) = &self.pool {
            return Ok(sqlx::query_as::<_, Schedule>(
                r#"
                update schedules
                set updated_at = now()
                where id in (
                    select id from schedules
                    where enabled = true and next_run_at is not null and next_run_at <= now()
                    order by next_run_at asc
                    for update skip locked
                    limit $1
                )
                returning id, project_id, name, definition_id, suite_id, cron_expression, timezone,
                          enabled, last_run_at, next_run_at, run_count, created_at, updated_at
                "#,
            )
            .bind(limit)
            .fetch_all(pool)
            .await?);
        }

        let mut store = self.store.lock().unwrap();
        let now = Utc::now();
        let due: Vec<Schedule> = store
            .schedules
            .iter()
            .filter(|s| s.enabled && s.next_run_at.is_some_and(|t| t <= now))
            .take(limit as usize)
            .cloned()
            .collect();
        for schedule in &due {
            if let Some(existing) = store.schedules.iter_mut().find(|s| s.id == schedule.id) {
                existing.updated_at = now;
            }
        }
        Ok(due)
    }

    pub async fn mark_schedule_fired(
        &self,
        id: Uuid,
        last_run_at: DateTime<Utc>,
        next_run_at: Option<DateTime<Utc>>,
    ) -> Result<(), anyhow::Error> {
        if let Some(pool) = &self.pool {
            sqlx::query(
                r#"
                update schedules
                set last_run_at = $2, next_run_at = $3, run_count = run_count + 1, updated_at = now()
                where id = $1
                "#,
            )
            .bind(id)
            .bind(last_run_at)
            .bind(next_run_at)
            .execute(pool)
            .await?;
            return Ok(());
        }

        let mut store = self.store.lock().unwrap();
        if let Some(schedule) = store.schedules.iter_mut().find(|s| s.id == id) {
            schedule.last_run_at = Some(last_run_at);
            schedule.next_run_at = next_run_at;
            schedule.run_count += 1;
            schedule.updated_at = Utc::now();
        }
        Ok(())
    }

    pub async fn create_schedule(&self, schedule: &Schedule) -> Result<(), anyhow::Error> {
        if let Some(pool) = &self.pool {
            sqlx::query(
                r#"
                insert into schedules
                  (id, project_id, name, definition_id, suite_id, cron_expression, timezone,
                   enabled, last_run_at, next_run_at, run_count, created_at, updated_at)
                values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                "#,
            )
            .bind(schedule.id)
            .bind(schedule.project_id)
            .bind(&schedule.name)
            .bind(schedule.definition_id)
            .bind(schedule.suite_id)
            .bind(&schedule.cron_expression)
            .bind(&schedule.timezone)
            .bind(schedule.enabled)
            .bind(schedule.last_run_at)
            .bind(schedule.next_run_at)
            .bind(schedule.run_count)
            .bind(schedule.created_at)
            .bind(schedule.updated_at)
            .execute(pool)
            .await?;
            return Ok(());
        }

        let mut store = self.store.lock().unwrap();
        store.schedules.push(schedule.clone());
        Ok(())
    }

    pub async fn list_schedules(&self, project_id: Uuid) -> Result<Vec<Schedule>, anyhow::Error> {
        if let Some(pool) = &self.pool {
            return Ok(sqlx::query_as::<_, Schedule>(
                r#"
                select id, project_id, name, definition_id, suite_id, cron_expression, timezone,
                       enabled, last_run_at, next_run_at, run_count, created_at, updated_at
                from schedules where project_id = $1 order by created_at desc
                "#,
            )
            .bind(project_id)
            .fetch_all(pool)
            .await?);
        }

        let store = self.store.lock().unwrap();
        Ok(store
            .schedules
            .iter()
            .filter(|s| s.project_id == project_id)
            .cloned()
            .collect())
    }

    pub async fn get_schedule(&self, id: Uuid) -> Result<Option<Schedule>, anyhow::Error> {
        if let Some(pool) = &self.pool {
            return Ok(sqlx::query_as::<_, Schedule>(
                r#"
                select id, project_id, name, definition_id, suite_id, cron_expression, timezone,
                       enabled, last_run_at, next_run_at, run_count, created_at, updated_at
                from schedules where id = $1
                "#,
            )
            .bind(id)
            .fetch_optional(pool)
            .await?);
        }

        let store = self.store.lock().unwrap();
        Ok(store.schedules.iter().find(|s| s.id == id).cloned())
    }

    pub async fn set_schedule_enabled(&self, id: Uuid, enabled: bool) -> Result<(), anyhow::Error> {
        if let Some(pool) = &self.pool {
            sqlx::query("update schedules set enabled = $2, updated_at = now() where id = $1")
                .bind(id)
                .bind(enabled)
                .execute(pool)
                .await?;
            return Ok(());
        }

        let mut store = self.store.lock().unwrap();
        if let Some(schedule) = store.schedules.iter_mut().find(|s| s.id == id) {
            schedule.enabled = enabled;
            schedule.updated_at = Utc::now();
        }
        Ok(())
    }

    pub async fn delete_schedule(&self, id: Uuid) -> Result<(), anyhow::Error> {
        if let Some(pool) = &self.pool {
            sqlx::query("delete from schedules where id = $1")
                .bind(id)
                .execute(pool)
                .await?;
            return Ok(());
        }

        let mut store = self.store.lock().unwrap();
        store.schedules.retain(|s| s.id != id);
        Ok(())
    }

    pub async fn create_webhook(&self, webhook: &Webhook) -> Result<(), anyhow::Error> {
        if let Some(pool) = &self.pool {
            sqlx::query(
                r#"
                insert into webhooks (id, project_id, name, url, secret_hash, events, enabled, created_at, updated_at)
                values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                "#,
            )
            .bind(webhook.id)
            .bind(webhook.project_id)
            .bind(&webhook.name)
            .bind(&webhook.url)
            .bind(&webhook.secret_hash)
            .bind(&webhook.events)
            .bind(webhook.enabled)
            .bind(webhook.created_at)
            .bind(webhook.updated_at)
            .execute(pool)
            .await?;
            return Ok(());
        }

        let mut store = self.store.lock().unwrap();
        store.webhooks.push(webhook.clone());
        Ok(())
    }

    pub async fn list_webhooks(&self, project_id: Uuid) -> Result<Vec<Webhook>, anyhow::Error> {
        if let Some(pool) = &self.pool {
            return Ok(sqlx::query_as::<_, Webhook>(
                r#"
                select id, project_id, name, url, secret_hash, events, enabled, created_at, updated_at
                from webhooks where project_id = $1 order by created_at desc
                "#,
            )
            .bind(project_id)
            .fetch_all(pool)
            .await?);
        }

        let store = self.store.lock().unwrap();
        Ok(store
            .webhooks
            .iter()
            .filter(|w| w.project_id == project_id)
            .cloned()
            .collect())
    }

    // Webhooks enabled for a given event, regardless of project — called from
    // the run-status transition path, which only has the run's project_id
    // available, so this filters by project_id + event membership together.
    pub async fn list_webhooks_for_event(
        &self,
        project_id: Uuid,
        event: &str,
    ) -> Result<Vec<Webhook>, anyhow::Error> {
        if let Some(pool) = &self.pool {
            return Ok(sqlx::query_as::<_, Webhook>(
                r#"
                select id, project_id, name, url, secret_hash, events, enabled, created_at, updated_at
                from webhooks where project_id = $1 and enabled = true and $2 = any(events)
                "#,
            )
            .bind(project_id)
            .bind(event)
            .fetch_all(pool)
            .await?);
        }

        let store = self.store.lock().unwrap();
        Ok(store
            .webhooks
            .iter()
            .filter(|w| {
                w.project_id == project_id
                    && w.enabled
                    && w.events.iter().any(|e| e == event)
            })
            .cloned()
            .collect())
    }

    pub async fn get_webhook(&self, id: Uuid) -> Result<Option<Webhook>, anyhow::Error> {
        if let Some(pool) = &self.pool {
            return Ok(sqlx::query_as::<_, Webhook>(
                r#"
                select id, project_id, name, url, secret_hash, events, enabled, created_at, updated_at
                from webhooks where id = $1
                "#,
            )
            .bind(id)
            .fetch_optional(pool)
            .await?);
        }

        let store = self.store.lock().unwrap();
        Ok(store.webhooks.iter().find(|w| w.id == id).cloned())
    }

    pub async fn set_webhook_enabled(&self, id: Uuid, enabled: bool) -> Result<(), anyhow::Error> {
        if let Some(pool) = &self.pool {
            sqlx::query("update webhooks set enabled = $2, updated_at = now() where id = $1")
                .bind(id)
                .bind(enabled)
                .execute(pool)
                .await?;
            return Ok(());
        }

        let mut store = self.store.lock().unwrap();
        if let Some(webhook) = store.webhooks.iter_mut().find(|w| w.id == id) {
            webhook.enabled = enabled;
            webhook.updated_at = Utc::now();
        }
        Ok(())
    }

    pub async fn delete_webhook(&self, id: Uuid) -> Result<(), anyhow::Error> {
        if let Some(pool) = &self.pool {
            sqlx::query("delete from webhooks where id = $1")
                .bind(id)
                .execute(pool)
                .await?;
            return Ok(());
        }

        let mut store = self.store.lock().unwrap();
        store.webhooks.retain(|w| w.id != id);
        Ok(())
    }

    pub async fn record_webhook_delivery(
        &self,
        delivery: &WebhookDelivery,
    ) -> Result<(), anyhow::Error> {
        if let Some(pool) = &self.pool {
            sqlx::query(
                r#"
                insert into webhook_deliveries
                  (id, webhook_id, event, payload, response_status, response_body, duration_ms, success, attempt, delivered_at)
                values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                "#,
            )
            .bind(delivery.id)
            .bind(delivery.webhook_id)
            .bind(&delivery.event)
            .bind(&delivery.payload)
            .bind(delivery.response_status)
            .bind(&delivery.response_body)
            .bind(delivery.duration_ms)
            .bind(delivery.success)
            .bind(delivery.attempt)
            .bind(delivery.delivered_at)
            .execute(pool)
            .await?;
            return Ok(());
        }

        let mut store = self.store.lock().unwrap();
        store.webhook_deliveries.push(delivery.clone());
        Ok(())
    }

    pub async fn list_webhook_deliveries(
        &self,
        webhook_id: Uuid,
    ) -> Result<Vec<WebhookDelivery>, anyhow::Error> {
        if let Some(pool) = &self.pool {
            return Ok(sqlx::query_as::<_, WebhookDelivery>(
                r#"
                select id, webhook_id, event, payload, response_status, response_body, duration_ms, success, attempt, delivered_at
                from webhook_deliveries where webhook_id = $1 order by delivered_at desc
                "#,
            )
            .bind(webhook_id)
            .fetch_all(pool)
            .await?);
        }

        let store = self.store.lock().unwrap();
        Ok(store
            .webhook_deliveries
            .iter()
            .filter(|d| d.webhook_id == webhook_id)
            .cloned()
            .collect())
    }

    pub async fn update_test_run(&self, run: &TestRun) -> Result<(), anyhow::Error> {
        if let Some(pool) = &self.pool {
            sqlx::query(
                r#"
                update test_runs
                set definition_id = $2, suite_id = $3, executor_id = $4, agent_id = $5,
                    status = $6, result = $7, error = $8, started_at = $9, finished_at = $10, updated_at = $11
                where id = $1
                "#,
            )
            .bind(run.id)
            .bind(run.definition_id)
            .bind(run.suite_id)
            .bind(run.executor_id)
            .bind(run.agent_id)
            .bind(&run.status)
            .bind(&run.result)
            .bind(&run.error)
            .bind(run.started_at)
            .bind(run.finished_at)
            .bind(run.updated_at)
            .execute(pool)
            .await?;
            return Ok(());
        }

        let mut store = self.store.lock().unwrap();
        if let Some(existing) = store.runs.iter_mut().find(|r| r.id == run.id) {
            *existing = run.clone();
        }
        Ok(())
    }

    pub async fn list_test_runs(
        &self,
        project_id: Option<Uuid>,
        _profile_id: Option<Uuid>,
    ) -> Result<Vec<TestRun>, anyhow::Error> {
        let project_id = project_id.unwrap_or(self.default_project_id);
        if let Some(pool) = &self.pool {
            return Ok(sqlx::query_as::<_, TestRunRow>(
                r#"
                select id, project_id, definition_id, suite_id, executor_id, agent_id, status, result, error,
                       queued_at, started_at, finished_at, created_at, updated_at
                from test_runs where project_id = $1 order by created_at desc
                "#,
            )
            .bind(project_id)
            .fetch_all(pool)
            .await?
            .into_iter()
            .map(Into::into)
            .collect());
        }

        let store = self.store.lock().unwrap();
        Ok(store
            .runs
            .iter()
            .filter(|r| r.project_id == project_id)
            .cloned()
            .collect())
    }

    pub async fn count_project_runs(&self, project_id: Uuid) -> Result<usize, anyhow::Error> {
        if let Some(pool) = &self.pool {
            let count = sqlx::query_scalar::<_, i64>(
                "select count(*) from test_runs where project_id = $1",
            )
            .bind(project_id)
            .fetch_one(pool)
            .await?;
            return Ok(count as usize);
        }

        let store = self.store.lock().unwrap();
        Ok(store
            .runs
            .iter()
            .filter(|r| r.project_id == project_id)
            .count())
    }

    pub async fn get_test_run(&self, id: Uuid) -> Result<Option<TestRun>, anyhow::Error> {
        if let Some(pool) = &self.pool {
            return Ok(sqlx::query_as::<_, TestRunRow>(
                r#"
                select id, project_id, definition_id, suite_id, executor_id, agent_id, status, result, error,
                       queued_at, started_at, finished_at, created_at, updated_at
                from test_runs where id = $1
                "#,
            )
            .bind(id)
            .fetch_optional(pool)
            .await?
            .map(Into::into));
        }

        let store = self.store.lock().unwrap();
        Ok(store.runs.iter().find(|r| r.id == id).cloned())
    }

    pub async fn claim_next_run(
        &self,
        project_id: Uuid,
        agent_id: Uuid,
    ) -> Result<Option<TestRun>, anyhow::Error> {
        if let Some(pool) = &self.pool {
            return Ok(sqlx::query_as::<_, TestRunRow>(
                r#"
                update test_runs
                set agent_id = $2, status = 'running', started_at = now(), updated_at = now()
                where id = (
                    select id from test_runs
                    where project_id = $1 and status = 'queued' and agent_id is null
                    order by queued_at asc
                    for update skip locked
                    limit 1
                )
                returning id, project_id, definition_id, suite_id, executor_id, agent_id, status, result, error,
                          queued_at, started_at, finished_at, created_at, updated_at
                "#,
            )
            .bind(project_id)
            .bind(agent_id)
            .fetch_optional(pool)
            .await?
            .map(Into::into));
        }

        let mut store = self.store.lock().unwrap();
        if let Some(run) = store
            .runs
            .iter_mut()
            .filter(|r| r.project_id == project_id && r.status == "queued" && r.agent_id.is_none())
            .min_by_key(|r| r.queued_at)
        {
            run.agent_id = Some(agent_id);
            run.status = "running".to_string();
            run.started_at = Some(Utc::now());
            run.updated_at = Utc::now();
            return Ok(Some(run.clone()));
        }
        Ok(None)
    }

    pub async fn list_executors(&self, project_id: Uuid) -> Result<Vec<Executor>, anyhow::Error> {
        if let Some(pool) = &self.pool {
            return Ok(sqlx::query_as::<_, Executor>(
                r#"
                select id, project_id, name, executor_type, image, config, status, created_at, updated_at
                from executors where project_id = $1 order by created_at desc
                "#,
            )
            .bind(project_id)
            .fetch_all(pool)
            .await?);
        }

        let store = self.store.lock().unwrap();
        Ok(store
            .executors
            .iter()
            .filter(|e| e.project_id == project_id)
            .cloned()
            .collect())
    }

    pub async fn create_executor(&self, executor: Executor) -> Result<Executor, anyhow::Error> {
        if let Some(pool) = &self.pool {
            return Ok(sqlx::query_as::<_, Executor>(
                r#"
                insert into executors
                  (id, project_id, name, executor_type, image, config, status, created_at, updated_at)
                values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                returning id, project_id, name, executor_type, image, config, status, created_at, updated_at
                "#,
            )
            .bind(executor.id)
            .bind(executor.project_id)
            .bind(&executor.name)
            .bind(&executor.executor_type)
            .bind(&executor.image)
            .bind(&executor.config)
            .bind(&executor.status)
            .bind(executor.created_at)
            .bind(executor.updated_at)
            .fetch_one(pool)
            .await?);
        }

        let mut store = self.store.lock().unwrap();
        store.executors.push(executor.clone());
        Ok(executor)
    }

    pub async fn get_executor(&self, id: Uuid) -> Result<Option<Executor>, anyhow::Error> {
        if let Some(pool) = &self.pool {
            return Ok(sqlx::query_as::<_, Executor>(
                r#"
                select id, project_id, name, executor_type, image, config, status, created_at, updated_at
                from executors where id = $1
                "#,
            )
            .bind(id)
            .fetch_optional(pool)
            .await?);
        }

        let store = self.store.lock().unwrap();
        Ok(store.executors.iter().find(|e| e.id == id).cloned())
    }

    pub async fn update_executor(&self, executor: Executor) -> Result<Executor, anyhow::Error> {
        if let Some(pool) = &self.pool {
            return Ok(sqlx::query_as::<_, Executor>(
                r#"
                update executors
                set name = $2, executor_type = $3, image = $4, config = $5, status = $6, updated_at = $7
                where id = $1
                returning id, project_id, name, executor_type, image, config, status, created_at, updated_at
                "#,
            )
            .bind(executor.id)
            .bind(&executor.name)
            .bind(&executor.executor_type)
            .bind(&executor.image)
            .bind(&executor.config)
            .bind(&executor.status)
            .bind(executor.updated_at)
            .fetch_one(pool)
            .await?);
        }

        let mut store = self.store.lock().unwrap();
        if let Some(existing) = store.executors.iter_mut().find(|e| e.id == executor.id) {
            *existing = executor.clone();
        }
        Ok(executor)
    }

    pub async fn delete_executor(&self, id: Uuid) -> Result<(), anyhow::Error> {
        if let Some(pool) = &self.pool {
            sqlx::query("delete from executors where id = $1")
                .bind(id)
                .execute(pool)
                .await?;
            return Ok(());
        }

        let mut store = self.store.lock().unwrap();
        store.executors.retain(|e| e.id != id);
        Ok(())
    }

    pub async fn list_test_suites(
        &self,
        project_id: Uuid,
    ) -> Result<Vec<TestSuite>, anyhow::Error> {
        if let Some(pool) = &self.pool {
            let rows = sqlx::query_as::<_, TestSuiteRow>(
                "select id, project_id, name, description, created_at, updated_at from test_suites where project_id = $1 order by created_at desc",
            )
            .bind(project_id)
            .fetch_all(pool)
            .await?;
            let mut suites = Vec::with_capacity(rows.len());
            for row in rows {
                suites.push(self.test_suite_from_row(pool, row).await?);
            }
            return Ok(suites);
        }

        let store = self.store.lock().unwrap();
        Ok(store
            .suites
            .iter()
            .filter(|s| s.project_id == project_id)
            .cloned()
            .collect())
    }

    pub async fn create_test_suite(&self, suite: TestSuite) -> Result<TestSuite, anyhow::Error> {
        if let Some(pool) = &self.pool {
            let mut tx = pool.begin().await?;
            let row = sqlx::query_as::<_, TestSuiteRow>(
                r#"
                insert into test_suites (id, project_id, name, description, created_at, updated_at)
                values ($1, $2, $3, $4, $5, $6)
                returning id, project_id, name, description, created_at, updated_at
                "#,
            )
            .bind(suite.id)
            .bind(suite.project_id)
            .bind(&suite.name)
            .bind(&suite.description)
            .bind(suite.created_at)
            .bind(suite.updated_at)
            .fetch_one(&mut *tx)
            .await?;
            for (position, definition_id) in suite.test_definition_ids.iter().enumerate() {
                sqlx::query(
                    "insert into test_suite_definitions (suite_id, definition_id, position) values ($1, $2, $3)",
                )
                .bind(suite.id)
                .bind(definition_id)
                .bind(position as i32)
                .execute(&mut *tx)
                .await?;
            }
            tx.commit().await?;
            return self.test_suite_from_row(pool, row).await;
        }

        let mut store = self.store.lock().unwrap();
        store.suites.push(suite.clone());
        Ok(suite)
    }

    pub async fn get_test_suite(&self, id: Uuid) -> Result<Option<TestSuite>, anyhow::Error> {
        if let Some(pool) = &self.pool {
            let row = sqlx::query_as::<_, TestSuiteRow>(
                "select id, project_id, name, description, created_at, updated_at from test_suites where id = $1",
            )
            .bind(id)
            .fetch_optional(pool)
            .await?;
            if let Some(row) = row {
                return Ok(Some(self.test_suite_from_row(pool, row).await?));
            }
            return Ok(None);
        }

        let store = self.store.lock().unwrap();
        Ok(store.suites.iter().find(|s| s.id == id).cloned())
    }

    pub async fn update_test_suite(&self, suite: TestSuite) -> Result<TestSuite, anyhow::Error> {
        if let Some(pool) = &self.pool {
            let mut tx = pool.begin().await?;
            let row = sqlx::query_as::<_, TestSuiteRow>(
                r#"
                update test_suites
                set name = $2, description = $3, updated_at = $4
                where id = $1
                returning id, project_id, name, description, created_at, updated_at
                "#,
            )
            .bind(suite.id)
            .bind(&suite.name)
            .bind(&suite.description)
            .bind(suite.updated_at)
            .fetch_one(&mut *tx)
            .await?;
            sqlx::query("delete from test_suite_definitions where suite_id = $1")
                .bind(suite.id)
                .execute(&mut *tx)
                .await?;
            for (position, definition_id) in suite.test_definition_ids.iter().enumerate() {
                sqlx::query(
                    "insert into test_suite_definitions (suite_id, definition_id, position) values ($1, $2, $3)",
                )
                .bind(suite.id)
                .bind(definition_id)
                .bind(position as i32)
                .execute(&mut *tx)
                .await?;
            }
            tx.commit().await?;
            return self.test_suite_from_row(pool, row).await;
        }

        let mut store = self.store.lock().unwrap();
        if let Some(existing) = store.suites.iter_mut().find(|s| s.id == suite.id) {
            *existing = suite.clone();
        }
        Ok(suite)
    }

    pub async fn delete_test_suite(&self, id: Uuid) -> Result<(), anyhow::Error> {
        if let Some(pool) = &self.pool {
            sqlx::query("delete from test_suites where id = $1")
                .bind(id)
                .execute(pool)
                .await?;
            return Ok(());
        }

        let mut store = self.store.lock().unwrap();
        store.suites.retain(|s| s.id != id);
        Ok(())
    }

    async fn test_suite_from_row(
        &self,
        pool: &PgPool,
        row: TestSuiteRow,
    ) -> Result<TestSuite, anyhow::Error> {
        let test_definition_ids = sqlx::query_scalar::<_, Uuid>(
            r#"
            select definition_id
            from test_suite_definitions
            where suite_id = $1
            order by position asc
            "#,
        )
        .bind(row.id)
        .fetch_all(pool)
        .await?;

        Ok(TestSuite {
            id: row.id,
            project_id: row.project_id,
            name: row.name,
            description: row.description,
            test_definition_ids,
            execution_mode: "sequential".to_string(),
            created_at: row.created_at,
            updated_at: row.updated_at,
        })
    }

    pub async fn create_agent_token(
        &self,
        project_id: Uuid,
        name: String,
    ) -> Result<AgentTokenCreated, anyhow::Error> {
        let token = format!("stc_{}", Uuid::new_v4().simple());
        let now = Utc::now();
        let record = AgentToken {
            id: Uuid::new_v4(),
            project_id,
            name: name.clone(),
            token_hash: hash_token(&token),
            last_used_at: None,
            revoked_at: None,
            created_at: now,
        };
        if let Some(pool) = &self.pool {
            sqlx::query(
                r#"
                insert into agent_tokens (id, project_id, name, token_hash, last_used_at, revoked_at, created_at)
                values ($1, $2, $3, $4, $5, $6, $7)
                "#,
            )
            .bind(record.id)
            .bind(record.project_id)
            .bind(&record.name)
            .bind(&record.token_hash)
            .bind(record.last_used_at)
            .bind(record.revoked_at)
            .bind(record.created_at)
            .execute(pool)
            .await?;
            return Ok(AgentTokenCreated {
                id: record.id,
                project_id,
                name,
                token,
                created_at: now,
            });
        }

        let mut store = self.store.lock().unwrap();
        store.agent_tokens.push(record.clone());
        Ok(AgentTokenCreated {
            id: record.id,
            project_id,
            name,
            token,
            created_at: now,
        })
    }

    pub async fn list_agent_tokens(
        &self,
        project_id: Uuid,
    ) -> Result<Vec<AgentToken>, anyhow::Error> {
        if let Some(pool) = &self.pool {
            return Ok(sqlx::query_as::<_, AgentToken>(
                r#"
                select id, project_id, name, token_hash, last_used_at, revoked_at, created_at
                from agent_tokens where project_id = $1 order by created_at desc
                "#,
            )
            .bind(project_id)
            .fetch_all(pool)
            .await?);
        }

        let store = self.store.lock().unwrap();
        Ok(store
            .agent_tokens
            .iter()
            .filter(|t| t.project_id == project_id)
            .cloned()
            .collect())
    }

    pub async fn count_active_agent_tokens(
        &self,
        project_id: Uuid,
    ) -> Result<usize, anyhow::Error> {
        if let Some(pool) = &self.pool {
            let count = sqlx::query_scalar::<_, i64>(
                "select count(*) from agent_tokens where project_id = $1 and revoked_at is null",
            )
            .bind(project_id)
            .fetch_one(pool)
            .await?;
            return Ok(count as usize);
        }

        let store = self.store.lock().unwrap();
        Ok(store
            .agent_tokens
            .iter()
            .filter(|t| t.project_id == project_id && t.revoked_at.is_none())
            .count())
    }

    pub async fn revoke_agent_token(&self, id: Uuid) -> Result<(), anyhow::Error> {
        if let Some(pool) = &self.pool {
            sqlx::query("update agent_tokens set revoked_at = now() where id = $1")
                .bind(id)
                .execute(pool)
                .await?;
            return Ok(());
        }

        let mut store = self.store.lock().unwrap();
        if let Some(token) = store.agent_tokens.iter_mut().find(|t| t.id == id) {
            token.revoked_at = Some(Utc::now());
        }
        Ok(())
    }

    pub async fn authenticate_agent_token(
        &self,
        token: &str,
    ) -> Result<Option<AgentToken>, anyhow::Error> {
        if let Some(pool) = &self.pool {
            let token_hash = hash_token(token);
            let record = sqlx::query_as::<_, AgentToken>(
                r#"
                update agent_tokens
                set last_used_at = now()
                where token_hash = $1 and revoked_at is null
                returning id, project_id, name, token_hash, last_used_at, revoked_at, created_at
                "#,
            )
            .bind(token_hash)
            .fetch_optional(pool)
            .await?;
            return Ok(record);
        }

        let mut store = self.store.lock().unwrap();
        let token_hash = hash_token(token);
        if let Some(record) = store
            .agent_tokens
            .iter_mut()
            .find(|t| t.token_hash == token_hash && t.revoked_at.is_none())
        {
            record.last_used_at = Some(Utc::now());
            return Ok(Some(record.clone()));
        }
        Ok(None)
    }

    pub async fn check_in_agent(
        &self,
        token: &AgentToken,
        name: String,
        version: Option<String>,
        status: String,
    ) -> Result<Agent, anyhow::Error> {
        if let Some(pool) = &self.pool {
            let existing_id = sqlx::query_scalar::<_, Uuid>(
                "select id from agents where token_id = $1 and name = $2 order by created_at asc limit 1",
            )
            .bind(token.id)
            .bind(&name)
            .fetch_optional(pool)
            .await?;

            if let Some(existing_id) = existing_id {
                return Ok(sqlx::query_as::<_, Agent>(
                    r#"
                    update agents
                    set version = $2, status = $3, last_seen_at = now(), updated_at = now()
                    where id = $1
                    returning id, project_id, token_id, name, version, status, last_seen_at, created_at, updated_at
                    "#,
                )
                .bind(existing_id)
                .bind(&version)
                .bind(&status)
                .fetch_one(pool)
                .await?);
            }

            return Ok(sqlx::query_as::<_, Agent>(
                r#"
                insert into agents (project_id, token_id, name, version, status, last_seen_at)
                values ($1, $2, $3, $4, $5, now())
                returning id, project_id, token_id, name, version, status, last_seen_at, created_at, updated_at
                "#,
            )
            .bind(token.project_id)
            .bind(token.id)
            .bind(&name)
            .bind(&version)
            .bind(&status)
            .fetch_one(pool)
            .await?);
        }

        let now = Utc::now();
        let mut store = self.store.lock().unwrap();
        if let Some(agent) = store
            .agents
            .iter_mut()
            .find(|a| a.token_id == Some(token.id) && a.name == name)
        {
            agent.version = version;
            agent.status = status;
            agent.last_seen_at = Some(now);
            agent.updated_at = now;
            return Ok(agent.clone());
        }
        let agent = Agent {
            id: Uuid::new_v4(),
            project_id: token.project_id,
            token_id: Some(token.id),
            name,
            version,
            status,
            last_seen_at: Some(now),
            created_at: now,
            updated_at: now,
        };
        store.agents.push(agent.clone());
        Ok(agent)
    }

    pub async fn list_agents(&self, project_id: Uuid) -> Result<Vec<Agent>, anyhow::Error> {
        if let Some(pool) = &self.pool {
            return Ok(sqlx::query_as::<_, Agent>(
                r#"
                select id, project_id, token_id, name, version, status, last_seen_at, created_at, updated_at
                from agents where project_id = $1 order by last_seen_at desc nulls last
                "#,
            )
            .bind(project_id)
            .fetch_all(pool)
            .await?);
        }

        let store = self.store.lock().unwrap();
        Ok(store
            .agents
            .iter()
            .filter(|a| a.project_id == project_id)
            .cloned()
            .collect())
    }

    pub async fn list_plans(&self) -> Result<Vec<Plan>, anyhow::Error> {
        let store = self.store.lock().unwrap();
        Ok(store.plans.clone())
    }

    pub async fn get_plan_by_slug(&self, slug: &str) -> Result<Option<Plan>, anyhow::Error> {
        let store = self.store.lock().unwrap();
        Ok(store.plans.iter().find(|p| p.slug == slug).cloned())
    }

    pub async fn create_organization(
        &self,
        organization: &Organization,
    ) -> Result<(), anyhow::Error> {
        let mut store = self.store.lock().unwrap();
        store.organizations.push(organization.clone());
        Ok(())
    }

    pub async fn get_organization_by_id(
        &self,
        id: Uuid,
    ) -> Result<Option<Organization>, anyhow::Error> {
        let store = self.store.lock().unwrap();
        Ok(store.organizations.iter().find(|o| o.id == id).cloned())
    }

    pub async fn get_organization_by_stripe_customer_id(
        &self,
        stripe_customer_id: &str,
    ) -> Result<Option<Organization>, anyhow::Error> {
        let store = self.store.lock().unwrap();
        Ok(store
            .organizations
            .iter()
            .find(|o| o.stripe_customer_id.as_deref() == Some(stripe_customer_id))
            .cloned())
    }

    pub async fn update_organization(
        &self,
        organization: &Organization,
    ) -> Result<(), anyhow::Error> {
        let mut store = self.store.lock().unwrap();
        if let Some(existing) = store
            .organizations
            .iter_mut()
            .find(|o| o.id == organization.id)
        {
            *existing = organization.clone();
        }
        Ok(())
    }

    pub async fn create_subscription(
        &self,
        subscription: &OrgSubscription,
    ) -> Result<(), anyhow::Error> {
        let mut store = self.store.lock().unwrap();
        store.subscriptions.push(subscription.clone());
        Ok(())
    }

    pub async fn get_subscription_by_stripe_id(
        &self,
        stripe_subscription_id: &str,
    ) -> Result<Option<OrgSubscription>, anyhow::Error> {
        let store = self.store.lock().unwrap();
        Ok(store
            .subscriptions
            .iter()
            .find(|s| s.stripe_subscription_id == stripe_subscription_id)
            .cloned())
    }

    pub async fn get_subscription_by_organization_id(
        &self,
        organization_id: Uuid,
    ) -> Result<Option<OrgSubscription>, anyhow::Error> {
        let store = self.store.lock().unwrap();
        Ok(store
            .subscriptions
            .iter()
            .find(|s| s.organization_id == organization_id)
            .cloned())
    }

    pub async fn update_subscription(
        &self,
        subscription: &OrgSubscription,
    ) -> Result<(), anyhow::Error> {
        let mut store = self.store.lock().unwrap();
        if let Some(existing) = store
            .subscriptions
            .iter_mut()
            .find(|s| s.id == subscription.id)
        {
            *existing = subscription.clone();
        }
        Ok(())
    }
}

pub fn hash_token(token: &str) -> String {
    let mut hasher = DefaultHasher::new();
    token.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

fn slugify(name: &str) -> String {
    let slug: String = name
        .to_lowercase()
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() { c } else { '-' })
        .collect();
    slug.trim_matches('-')
        .split('-')
        .filter(|p| !p.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}

fn default_plans() -> Vec<Plan> {
    let now = Utc::now();
    vec![
        Plan {
            id: Uuid::new_v4(),
            slug: "free".to_string(),
            price_cents: 0,
            features: serde_json::json!({
                "max_projects": 1,
                "cloud_agent_tokens": 1,
                "seats": 1,
                "log_retention_days": 7,
                "result_storage_gb": 1,
                "support": "community"
            }),
            stripe_price_id: std::env::var("STRIPE_FREE_PRICE_ID").ok(),
            created_at: now,
            updated_at: now,
        },
        Plan {
            id: Uuid::new_v4(),
            slug: "pro".to_string(),
            price_cents: 2900,
            features: serde_json::json!({
                "max_projects": "unlimited",
                "cloud_agent_tokens": 10,
                "seats": 5,
                "log_retention_days": 30,
                "result_storage_gb": 25,
                "support": "priority",
                "private_cloud_agents": true,
                "audit_log": true
            }),
            stripe_price_id: std::env::var("STRIPE_PRO_PRICE_ID").ok(),
            created_at: now,
            updated_at: now,
        },
    ]
}

// Scheduled runs (issue #75): polls schedules for a due next_run_at, creates
// a queued test run the same way agent_trigger_run does (#74), then advances
// last_run_at/next_run_at/run_count. Runs as a background tokio task started
// from main.rs — not a route handler, since nothing external triggers it.
pub fn schedule_next_run_at(
    cron_expression: &str,
    timezone: &str,
    from: DateTime<Utc>,
) -> Result<Option<DateTime<Utc>>, anyhow::Error> {
    use chrono_tz::Tz;
    use croner::Cron;

    let tz: Tz = timezone
        .parse()
        .map_err(|_| anyhow::anyhow!("unknown timezone: {timezone}"))?;
    let cron = Cron::new(cron_expression)
        .parse()
        .map_err(|e| anyhow::anyhow!("invalid cron expression '{cron_expression}': {e}"))?;

    let from_tz = from.with_timezone(&tz);
    Ok(cron
        .find_next_occurrence(&from_tz, false)
        .ok()
        .map(|next| next.with_timezone(&Utc)))
}

pub async fn run_due_schedules_once(db: &Database) -> Result<usize, anyhow::Error> {
    let due = db.claim_due_schedules(20).await?;
    let mut fired = 0;

    for schedule in due {
        let now = Utc::now();
        let run = TestRun {
            id: Uuid::new_v4(),
            project_id: schedule.project_id,
            definition_id: schedule.definition_id,
            suite_id: schedule.suite_id,
            executor_id: None,
            agent_id: None,
            status: "queued".to_string(),
            result: None,
            error: None,
            queued_at: now,
            started_at: None,
            finished_at: None,
            created_at: now,
            updated_at: now,
        };

        if let Err(error) = db.create_test_run(&run).await {
            tracing::error!(schedule_id = %schedule.id, %error, "failed to create scheduled run");
            continue;
        }

        deliver_run_event(db, run.project_id, "queued", &run).await;

        let next_run_at = schedule_next_run_at(&schedule.cron_expression, &schedule.timezone, now)
            .unwrap_or(None);
        if let Err(error) = db.mark_schedule_fired(schedule.id, now, next_run_at).await {
            tracing::error!(schedule_id = %schedule.id, %error, "failed to advance schedule after firing");
        }
        fired += 1;
    }

    Ok(fired)
}

/// Spawns a background task that polls for due schedules every `interval`.
/// A failed poll is logged and retried on the next tick rather than crashing
/// the process — a scheduler outage should not take down the API server.
pub fn spawn_scheduler(db: Database, interval: std::time::Duration) -> tokio::task::JoinHandle<()> {
    tokio::spawn(async move {
        let mut ticker = tokio::time::interval(interval);
        loop {
            ticker.tick().await;
            match run_due_schedules_once(&db).await {
                Ok(0) => {}
                Ok(fired) => tracing::info!(fired, "scheduler fired due runs"),
                Err(error) => tracing::error!(%error, "scheduler poll failed"),
            }
        }
    })
}

// Outbound webhooks (issue #76): deliver a run-status-transition event to
// every enabled webhook subscribed to it. Fire-and-record — a failed
// delivery (network error, non-2xx, timeout) is logged to
// webhook_deliveries as success=false and does not fail the caller's
// request; the run-status update already succeeded by the time this runs.
// Payload is HMAC-SHA256 signed the same way Stripe's inbound webhook is
// verified (X-Webhook-Signature: v1=<hex>), so receivers can authenticate it.
const WEBHOOK_TIMEOUT: std::time::Duration = std::time::Duration::from_secs(10);

pub async fn deliver_run_event(db: &Database, project_id: Uuid, event: &str, run: &TestRun) {
    let webhooks = match db.list_webhooks_for_event(project_id, event).await {
        Ok(webhooks) => webhooks,
        Err(error) => {
            tracing::error!(%error, event, "failed to look up webhooks for event");
            return;
        }
    };

    if webhooks.is_empty() {
        return;
    }

    let payload = serde_json::json!({
        "event": event,
        "run": run,
        "delivered_at": Utc::now(),
    });

    for webhook in webhooks {
        deliver_one(db, &webhook, event, &payload).await;
    }
}

async fn deliver_one(db: &Database, webhook: &Webhook, event: &str, payload: &Value) {
    use hmac::{Hmac, Mac};
    use sha2::Sha256;
    type HmacSha256 = Hmac<Sha256>;

    let body = payload.to_string();
    let started = std::time::Instant::now();

    let client = match reqwest::Client::builder().timeout(WEBHOOK_TIMEOUT).build() {
        Ok(client) => client,
        Err(error) => {
            tracing::error!(%error, "failed to build webhook http client");
            return;
        }
    };

    let mut request = client
        .post(&webhook.url)
        .header("Content-Type", "application/json");

    if let Some(secret_hash) = &webhook.secret_hash {
        if let Ok(mut mac) = HmacSha256::new_from_slice(secret_hash.as_bytes()) {
            mac.update(body.as_bytes());
            let signature = format!("v1={}", hex::encode(mac.finalize().into_bytes()));
            request = request.header("X-Webhook-Signature", signature);
        }
    }

    let result = request.body(body).send().await;
    let duration_ms = started.elapsed().as_millis() as i32;

    let (response_status, response_body, success) = match result {
        Ok(response) => {
            let status = response.status().as_u16() as i32;
            let ok = response.status().is_success();
            let body_text = response.text().await.ok();
            (Some(status), body_text, ok)
        }
        Err(error) => (None, Some(error.to_string()), false),
    };

    let delivery = WebhookDelivery {
        id: Uuid::new_v4(),
        webhook_id: webhook.id,
        event: event.to_string(),
        payload: payload.clone(),
        response_status,
        response_body: response_body.map(|b| b.chars().take(2000).collect()),
        duration_ms: Some(duration_ms),
        success,
        attempt: 1,
        delivered_at: Utc::now(),
    };

    if let Err(error) = db.record_webhook_delivery(&delivery).await {
        tracing::error!(%error, webhook_id = %webhook.id, "failed to record webhook delivery");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn initializes_default_project_and_plans() {
        let db = Database::new("test://").await.unwrap();
        let projects = db.list_projects(None).await.unwrap();
        let plans = db.list_plans().await.unwrap();

        assert_eq!(projects.len(), 1);
        assert_eq!(projects[0].slug, "default");
        assert_eq!(plans.len(), 2);
        assert!(plans.iter().any(|p| p.slug == "free"));
        assert!(plans.iter().any(|p| p.slug == "pro"));
    }

    #[tokio::test]
    async fn definition_crud_is_project_scoped() {
        let db = Database::new("test://").await.unwrap();
        let now = Utc::now();
        let definition = TestDefinition {
            id: Uuid::new_v4(),
            project_id: db.default_project_id(),
            name: "API smoke".to_string(),
            description: Some("basic endpoint coverage".to_string()),
            image: "node:20".to_string(),
            commands: vec!["pnpm test".to_string()],
            executor_id: None,
            labels: vec!["api".to_string()],
            created_at: now,
            updated_at: now,
        };

        db.create_test_definition(&definition).await.unwrap();
        assert_eq!(
            db.list_test_definitions(Some(definition.project_id), None)
                .await
                .unwrap()
                .len(),
            1
        );
        assert_eq!(
            db.get_test_definition(definition.id)
                .await
                .unwrap()
                .unwrap()
                .image,
            "node:20"
        );

        db.delete_test_definition(definition.id).await.unwrap();
        assert!(db
            .get_test_definition(definition.id)
            .await
            .unwrap()
            .is_none());
    }

    #[tokio::test]
    async fn agent_token_checkin_and_claim_queue() {
        let db = Database::new("test://").await.unwrap();
        let token = db
            .create_agent_token(db.default_project_id(), "cluster".to_string())
            .await
            .unwrap();
        let auth = db
            .authenticate_agent_token(&token.token)
            .await
            .unwrap()
            .unwrap();
        let agent = db
            .check_in_agent(
                &auth,
                "agent-1".to_string(),
                Some("0.1.0".to_string()),
                "online".to_string(),
            )
            .await
            .unwrap();
        let now = Utc::now();
        let run = TestRun {
            id: Uuid::new_v4(),
            project_id: db.default_project_id(),
            definition_id: None,
            suite_id: None,
            executor_id: None,
            agent_id: None,
            status: "queued".to_string(),
            result: None,
            error: None,
            queued_at: now,
            started_at: None,
            finished_at: None,
            created_at: now,
            updated_at: now,
        };

        db.create_test_run(&run).await.unwrap();
        let claimed = db
            .claim_next_run(db.default_project_id(), agent.id)
            .await
            .unwrap()
            .unwrap();
        assert_eq!(claimed.status, "running");
        assert_eq!(claimed.agent_id, Some(agent.id));
        assert!(db
            .claim_next_run(db.default_project_id(), agent.id)
            .await
            .unwrap()
            .is_none());
    }

    #[test]
    fn schedule_next_run_at_computes_the_next_occurrence() {
        // 2026-07-18 is a Saturday; "0 9 * * MON" is every Monday at 09:00 UTC.
        let from = chrono::DateTime::parse_from_rfc3339("2026-07-18T12:00:00Z")
            .unwrap()
            .with_timezone(&Utc);
        let next = schedule_next_run_at("0 9 * * MON", "UTC", from)
            .unwrap()
            .unwrap();
        assert_eq!(next.format("%Y-%m-%d %H:%M").to_string(), "2026-07-20 09:00");
    }

    #[test]
    fn schedule_next_run_at_rejects_invalid_cron() {
        let from = Utc::now();
        assert!(schedule_next_run_at("not a cron expression", "UTC", from).is_err());
    }

    #[test]
    fn schedule_next_run_at_rejects_unknown_timezone() {
        let from = Utc::now();
        assert!(schedule_next_run_at("* * * * *", "Not/ARealZone", from).is_err());
    }

    #[tokio::test]
    async fn due_schedule_fires_a_run_and_advances_next_run_at() {
        let db = Database::new("test://").await.unwrap();
        let definition = TestDefinition {
            id: Uuid::new_v4(),
            project_id: db.default_project_id(),
            name: "smoke test".to_string(),
            description: None,
            image: "node:20".to_string(),
            commands: vec!["npm test".to_string()],
            executor_id: None,
            labels: Default::default(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        db.create_test_definition(&definition).await.unwrap();

        let now = Utc::now();
        let schedule = Schedule {
            id: Uuid::new_v4(),
            project_id: db.default_project_id(),
            name: "nightly".to_string(),
            definition_id: Some(definition.id),
            suite_id: None,
            cron_expression: "* * * * *".to_string(),
            timezone: "UTC".to_string(),
            enabled: true,
            last_run_at: None,
            next_run_at: Some(now - chrono::Duration::minutes(1)), // already due
            run_count: 0,
            created_at: now,
            updated_at: now,
        };
        db.create_schedule(&schedule).await.unwrap();

        let fired = run_due_schedules_once(&db).await.unwrap();
        assert_eq!(fired, 1);

        let runs = db
            .list_test_runs(Some(db.default_project_id()), None)
            .await
            .unwrap();
        assert_eq!(runs.len(), 1, "a queued run was created for the due schedule");
        assert_eq!(runs[0].definition_id, Some(definition.id));
        assert_eq!(runs[0].status, "queued");

        let updated = db.get_schedule(schedule.id).await.unwrap().unwrap();
        assert_eq!(updated.run_count, 1);
        assert!(updated.last_run_at.is_some());
        assert!(
            updated.next_run_at.unwrap() > now,
            "next_run_at advanced past the fire time"
        );

        // A schedule not yet due must not fire again.
        let fired_again = run_due_schedules_once(&db).await.unwrap();
        assert_eq!(fired_again, 0);
    }

    #[tokio::test]
    async fn disabled_schedule_never_fires() {
        let db = Database::new("test://").await.unwrap();
        let definition = TestDefinition {
            id: Uuid::new_v4(),
            project_id: db.default_project_id(),
            name: "smoke test".to_string(),
            description: None,
            image: "node:20".to_string(),
            commands: vec!["npm test".to_string()],
            executor_id: None,
            labels: Default::default(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        db.create_test_definition(&definition).await.unwrap();

        let now = Utc::now();
        let schedule = Schedule {
            id: Uuid::new_v4(),
            project_id: db.default_project_id(),
            name: "disabled".to_string(),
            definition_id: Some(definition.id),
            suite_id: None,
            cron_expression: "* * * * *".to_string(),
            timezone: "UTC".to_string(),
            enabled: false,
            last_run_at: None,
            next_run_at: Some(now - chrono::Duration::minutes(1)),
            run_count: 0,
            created_at: now,
            updated_at: now,
        };
        db.create_schedule(&schedule).await.unwrap();

        let fired = run_due_schedules_once(&db).await.unwrap();
        assert_eq!(fired, 0);
    }

    // Minimal raw-TCP HTTP server for webhook delivery tests — avoids adding
    // a test-server dependency just for this. Reads one request, ignores its
    // contents beyond confirming a body was sent, replies with the given
    // status line, and returns the request bytes it saw.
    async fn serve_one_request(status_line: &'static str) -> (String, tokio::task::JoinHandle<Vec<u8>>) {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        let handle = tokio::spawn(async move {
            use tokio::io::{AsyncReadExt, AsyncWriteExt};
            let (mut socket, _) = listener.accept().await.unwrap();
            let mut buf = vec![0u8; 8192];
            let n = socket.read(&mut buf).await.unwrap_or(0);
            buf.truncate(n);
            let response = format!("{status_line}\r\nContent-Length: 0\r\n\r\n");
            let _ = socket.write_all(response.as_bytes()).await;
            buf
        });
        (format!("http://{addr}"), handle)
    }

    #[tokio::test]
    async fn webhook_receives_a_signed_post_on_queued_run() {
        let db = Database::new("test://").await.unwrap();
        let now = Utc::now();
        let webhook = Webhook {
            id: Uuid::new_v4(),
            project_id: db.default_project_id(),
            name: "test hook".to_string(),
            url: String::new(), // filled in below once the server is bound
            secret_hash: Some("test-secret".to_string()),
            events: vec!["queued".to_string()],
            enabled: true,
            created_at: now,
            updated_at: now,
        };

        let (url, handle) = serve_one_request("HTTP/1.1 200 OK").await;
        let webhook = Webhook { url, ..webhook };
        db.create_webhook(&webhook).await.unwrap();

        let run = TestRun {
            id: Uuid::new_v4(),
            project_id: db.default_project_id(),
            definition_id: None,
            suite_id: None,
            executor_id: None,
            agent_id: None,
            status: "queued".to_string(),
            result: None,
            error: None,
            queued_at: now,
            started_at: None,
            finished_at: None,
            created_at: now,
            updated_at: now,
        };

        deliver_run_event(&db, db.default_project_id(), "queued", &run).await;

        let received = handle.await.unwrap();
        let request_text = String::from_utf8_lossy(&received);
        assert!(request_text.contains("POST"), "delivered as a POST");
        assert!(
            request_text.to_lowercase().contains("x-webhook-signature: v1="),
            "signature header present: {request_text}"
        );

        let deliveries = db.list_webhook_deliveries(webhook.id).await.unwrap();
        assert_eq!(deliveries.len(), 1);
        assert!(deliveries[0].success);
        assert_eq!(deliveries[0].response_status, Some(200));
    }

    #[tokio::test]
    async fn webhook_delivery_records_failure_on_non_2xx() {
        let db = Database::new("test://").await.unwrap();
        let now = Utc::now();
        let (url, _handle) = serve_one_request("HTTP/1.1 500 Internal Server Error").await;
        let webhook = Webhook {
            id: Uuid::new_v4(),
            project_id: db.default_project_id(),
            name: "flaky hook".to_string(),
            url,
            secret_hash: None,
            events: vec!["failed".to_string()],
            enabled: true,
            created_at: now,
            updated_at: now,
        };
        db.create_webhook(&webhook).await.unwrap();

        let run = TestRun {
            id: Uuid::new_v4(),
            project_id: db.default_project_id(),
            definition_id: None,
            suite_id: None,
            executor_id: None,
            agent_id: None,
            status: "failed".to_string(),
            result: None,
            error: Some("boom".to_string()),
            queued_at: now,
            started_at: None,
            finished_at: Some(now),
            created_at: now,
            updated_at: now,
        };

        deliver_run_event(&db, db.default_project_id(), "failed", &run).await;

        let deliveries = db.list_webhook_deliveries(webhook.id).await.unwrap();
        assert_eq!(deliveries.len(), 1);
        assert!(!deliveries[0].success);
        assert_eq!(deliveries[0].response_status, Some(500));
    }

    #[tokio::test]
    async fn webhook_not_subscribed_to_event_is_not_called() {
        let db = Database::new("test://").await.unwrap();
        let now = Utc::now();
        let webhook = Webhook {
            id: Uuid::new_v4(),
            project_id: db.default_project_id(),
            name: "passed-only hook".to_string(),
            url: "http://127.0.0.1:1".to_string(), // would fail to connect if ever called
            secret_hash: None,
            events: vec!["passed".to_string()],
            enabled: true,
            created_at: now,
            updated_at: now,
        };
        db.create_webhook(&webhook).await.unwrap();

        let run = TestRun {
            id: Uuid::new_v4(),
            project_id: db.default_project_id(),
            definition_id: None,
            suite_id: None,
            executor_id: None,
            agent_id: None,
            status: "queued".to_string(),
            result: None,
            error: None,
            queued_at: now,
            started_at: None,
            finished_at: None,
            created_at: now,
            updated_at: now,
        };

        deliver_run_event(&db, db.default_project_id(), "queued", &run).await;

        let deliveries = db.list_webhook_deliveries(webhook.id).await.unwrap();
        assert_eq!(deliveries.len(), 0, "not subscribed to 'queued', must not be called");
    }
}
