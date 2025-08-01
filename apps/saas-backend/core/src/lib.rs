pub mod models;
pub mod db;

pub use models::*;

#[cfg(feature = "database")]
pub use db::{Database, create_connection_pool};

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use uuid::Uuid;

    #[test]
    fn test_run_creation() {
        let run = TestRun {
            id: Uuid::new_v4(),
            name: "Test Run".to_string(),
            image: "node:18-alpine".to_string(),
            command: vec!["npm test".to_string()],
            status: "running".to_string(),
            created_at: Utc::now(),
            duration: None,
            logs: Some(vec!["Starting test...".to_string()]),
            test_definition_id: Some(Uuid::new_v4()),
            executor_id: Some(Uuid::new_v4()),
        };

        assert_eq!(run.name, "Test Run");
        assert_eq!(run.status, "running");
        assert_eq!(run.command.len(), 1);
        assert!(run.test_definition_id.is_some());
        assert!(run.executor_id.is_some());
    }

    #[test]
    fn test_definition_creation() {
        let definition = TestDefinition {
            id: Uuid::new_v4(),
            name: "Test Definition".to_string(),
            description: Some("A test definition".to_string()),
            image: "node:18-alpine".to_string(),
            commands: vec!["npm install".to_string(), "npm test".to_string()],
            created_at: Utc::now(),
            executor_id: Some(Uuid::new_v4()),
            labels: Some(vec!["unit".to_string(), "javascript".to_string()]),
        };

        assert_eq!(definition.name, "Test Definition");
        assert!(definition.description.is_some());
        assert_eq!(definition.commands.len(), 2);
        assert!(definition.executor_id.is_some());
        assert!(definition.labels.is_some());
    }

    #[test]
    fn test_executor_creation() {
        let executor = TestExecutor {
            id: Uuid::new_v4(),
            name: "Jest Runner".to_string(),
            description: Some("JavaScript test runner".to_string()),
            image: "node:18-alpine".to_string(),
            default_command: "npm test".to_string(),
            supported_file_types: vec!["js".to_string(), "ts".to_string()],
            environment_variables: vec!["NODE_ENV".to_string()],
            icon: Some("🧪".to_string()),
        };

        assert_eq!(executor.name, "Jest Runner");
        assert_eq!(executor.default_command, "npm test");
        assert_eq!(executor.supported_file_types.len(), 2);
        assert!(executor.description.is_some());
        assert!(executor.icon.is_some());
    }

    #[test]
    fn test_suite_creation() {
        let definition_ids = vec![Uuid::new_v4(), Uuid::new_v4()];
        let suite = TestSuite {
            id: Uuid::new_v4(),
            name: "Frontend Test Suite".to_string(),
            description: Some("All frontend tests".to_string()),
            execution_mode: "sequential".to_string(),
            labels: Some(vec!["frontend".to_string(), "ui".to_string()]),
            test_definition_ids: definition_ids.clone(),
            created_at: Utc::now(),
        };

        assert_eq!(suite.name, "Frontend Test Suite");
        assert_eq!(suite.execution_mode, "sequential");
        assert_eq!(suite.test_definition_ids.len(), 2);
        assert_eq!(suite.test_definition_ids, definition_ids);
        assert!(suite.description.is_some());
        assert!(suite.labels.is_some());
    }

    #[test] 
    fn test_serialization() {
        let run = TestRun {
            id: Uuid::new_v4(),
            name: "Serialization Test".to_string(),
            image: "alpine:latest".to_string(),
            command: vec!["echo hello".to_string()],
            status: "completed".to_string(),
            created_at: Utc::now(),
            duration: Some(5000),
            logs: None,
            test_definition_id: None,
            executor_id: None,
        };

        // Test that we can serialize to JSON
        let json = serde_json::to_string(&run).expect("Should serialize to JSON");
        assert!(json.contains("Serialization Test"));
        assert!(json.contains("completed"));

        // Test that we can deserialize from JSON
        let deserialized: TestRun = serde_json::from_str(&json).expect("Should deserialize from JSON");
        assert_eq!(deserialized.name, run.name);
        assert_eq!(deserialized.status, run.status);
        assert_eq!(deserialized.duration, run.duration);
    }
}