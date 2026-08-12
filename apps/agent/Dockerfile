# syntax=docker/dockerfile:1

FROM rust:1.90-slim-bookworm AS builder

WORKDIR /workspace

COPY Cargo.toml ./
COPY apps/agent ./apps/agent
COPY apps/saas/backend ./apps/saas/backend

RUN cargo build --release -p sparktest-agent

FROM debian:bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /workspace/target/release/sparktest-agent /usr/local/bin/sparktest-agent

ENV SPARKTEST_AGENT_POLL_SECONDS=5

ENTRYPOINT ["sparktest-agent"]
