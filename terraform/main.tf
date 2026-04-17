terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {}

resource "docker_image" "app" {
  name = "dheepisha/devops_project-web:latest"
}

resource "docker_container" "app" {
  name  = "web"
  image = docker_image.app.name

  ports {
    internal = 3001
    external = 8081
  }

  env = [
    "PORT=3001",
    "MONGODB_URI=mongodb://mongo:27017/bookstore_db",
    "JWT_SECRET=replace_with_a_strong_secret"
  ]

  # 🔥 THIS LINE FIXES EVERYTHING
  networks_advanced {
    name = "devops_project_default"
  }
}