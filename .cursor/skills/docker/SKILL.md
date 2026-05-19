---
name: docker
description: Run Docker and Docker Compose commands with sudo in this project. Use when writing, suggesting, or executing docker/docker compose commands.
---

# Docker

## Purpose

Ensure Docker-related commands are compatible with this project environment.

## Rules

1. Always prepend `sudo` to `docker` commands.
2. Always prepend `sudo` to `docker compose` commands.
3. Keep the command behavior unchanged other than adding `sudo`.

## Examples

- `sudo docker ps`
- `sudo docker build -t my-image .`
- `sudo docker compose up -d`
- `sudo docker compose logs -f`
