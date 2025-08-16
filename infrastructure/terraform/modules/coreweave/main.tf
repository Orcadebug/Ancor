# CoreWeave deployment module for AI Infrastructure Platform

terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# CoreWeave uses S3-compatible object storage
provider "aws" {
  alias = "coreweave"
  
  access_key = var.coreweave_access_key
  secret_key = var.coreweave_secret_key
  region = "us-east-1"  # CoreWeave region mapping
  
  endpoints {
    s3 = "https://object.ord1.coreweave.com"
  }
  
  skip_credentials_validation = true
  skip_requesting_account_id = true
  skip_region_validation = true
}

# Local variables
locals {
  deployment_name = var.deployment_name
  namespace = "deployment-${substr(var.deployment_id, 0, 8)}"
  
  # CoreWeave GPU instance mapping
  gpu_instance_types = {
    "A100-40GB" = "a100-40gb"
    "A100-80GB" = "a100-80gb"
    "A40" = "a40"
    "RTX-A6000" = "rtx-a6000"
    "H100" = "h100"
  }
  
  # Model size to resource mapping
  model_resources = {
    "8b" = {
      gpu_type = "A40"
      gpu_count = 1
      memory_gb = 32
      storage_gb = 100
    }
    "70b" = {
      gpu_type = "A100-80GB"
      gpu_count = 2
      memory_gb = 128
      storage_gb = 500
    }
    "405b" = {
      gpu_type = "H100"
      gpu_count = 8
      memory_gb = 512
      storage_gb = 2000
    }
  }
  
  selected_resources = local.model_resources[var.model_size]
  
  common_labels = {
    "app.kubernetes.io/name" = "ai-platform"
    "app.kubernetes.io/instance" = var.deployment_id
    "app.kubernetes.io/component" = "inference"
    "app.kubernetes.io/managed-by" = "terraform"
    "platform.ai/deployment-id" = var.deployment_id
    "platform.ai/industry" = var.industry_template
  }
}

# Create namespace for deployment
resource "kubernetes_namespace" "deployment" {
  metadata {
    name = local.namespace
    labels = merge(local.common_labels, {
      "name" = local.namespace
    })
    annotations = {
      "platform.ai/deployment-name" = var.deployment_name
      "platform.ai/cloud-provider" = "coreweave"
    }
  }
}

# Create S3 bucket for document storage (CoreWeave Object Storage)
resource "aws_s3_bucket" "document_storage" {
  provider = aws.coreweave
  bucket = "ai-platform-${var.deployment_id}-documents"
  
  tags = var.tags
}

resource "aws_s3_bucket_versioning" "document_storage" {
  provider = aws.coreweave
  bucket = aws_s3_bucket.document_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "document_storage" {
  provider = aws.coreweave
  bucket = aws_s3_bucket.document_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Create S3 bucket for model storage
resource "aws_s3_bucket" "model_storage" {
  provider = aws.coreweave
  bucket = "ai-platform-${var.deployment_id}-models"
  
  tags = var.tags
}

# Create persistent volumes for ChromaDB
resource "kubernetes_persistent_volume_claim" "chromadb_storage" {
  metadata {
    name = "chromadb-storage"
    namespace = kubernetes_namespace.deployment.metadata[0].name
    labels = local.common_labels
  }
  
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "${var.chromadb_storage_size_gb}Gi"
      }
    }
    storage_class_name = "coreweave-ssd"
  }
}

# Create persistent volume for PostgreSQL
resource "kubernetes_persistent_volume_claim" "postgres_storage" {
  metadata {
    name = "postgres-storage"
    namespace = kubernetes_namespace.deployment.metadata[0].name
    labels = local.common_labels
  }
  
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "50Gi"
      }
    }
    storage_class_name = "coreweave-ssd"
  }
}

# Secret for S3 credentials
resource "kubernetes_secret" "s3_credentials" {
  metadata {
    name = "s3-credentials"
    namespace = kubernetes_namespace.deployment.metadata[0].name
    labels = local.common_labels
  }
  
  data = {
    access_key = var.coreweave_access_key
    secret_key = var.coreweave_secret_key
    endpoint = "https://object.ord1.coreweave.com"
    region = "us-east-1"
  }
  
  type = "Opaque"
}

# ConfigMap for deployment configuration
resource "kubernetes_config_map" "deployment_config" {
  metadata {
    name = "deployment-config"
    namespace = kubernetes_namespace.deployment.metadata[0].name
    labels = local.common_labels
  }
  
  data = {
    DEPLOYMENT_ID = var.deployment_id
    DEPLOYMENT_NAME = var.deployment_name
    MODEL_SIZE = var.model_size
    GPU_TYPE = local.selected_resources.gpu_type
    GPU_COUNT = tostring(local.selected_resources.gpu_count)
    INDUSTRY_TEMPLATE = var.industry_template
    CLOUD_PROVIDER = "coreweave"
    REGION = var.region
    STORAGE_BUCKET = aws_s3_bucket.document_storage.bucket
    MODEL_BUCKET = aws_s3_bucket.model_storage.bucket
    LOG_LEVEL = "INFO"
    MAX_CONCURRENT_REQUESTS = "100"
  }
}

# Deploy vLLM model server
resource "kubernetes_deployment" "vllm_server" {
  metadata {
    name = "vllm-server"
    namespace = kubernetes_namespace.deployment.metadata[0].name
    labels = merge(local.common_labels, {
      "app.kubernetes.io/component" = "vllm-server"
    })
  }
  
  spec {
    replicas = 1
    
    selector {
      match_labels = {
        "app.kubernetes.io/name" = "vllm-server"
        "app.kubernetes.io/instance" = var.deployment_id
      }
    }
    
    template {
      metadata {
        labels = merge(local.common_labels, {
          "app.kubernetes.io/name" = "vllm-server"
          "app.kubernetes.io/component" = "vllm-server"
        })
      }
      
      spec {
        node_selector = {
          "node.coreweave.cloud/gpu" = local.selected_resources.gpu_type
        }
        
        tolerations {
          key = "node.coreweave.cloud/gpu"
          operator = "Equal"
          value = local.selected_resources.gpu_type
          effect = "NoSchedule"
        }
        
        container {
          name = "vllm-server"
          image = "vllm/vllm-openai:latest"
          
          command = ["python", "-m", "vllm.entrypoints.openai.api_server"]
          args = [
            "--model", "meta-llama/Llama-3-${var.model_size}-Instruct",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--dtype", "auto",
            "--max-model-len", "8192",
            "--tensor-parallel-size", tostring(local.selected_resources.gpu_count),
            "--gpu-memory-utilization", "0.9"
          ]
          
          resources {
            requests = {
              "nvidia.com/gpu" = local.selected_resources.gpu_count
              memory = "${local.selected_resources.memory_gb}Gi"
              cpu = "8"
            }
            limits = {
              "nvidia.com/gpu" = local.selected_resources.gpu_count
              memory = "${local.selected_resources.memory_gb}Gi"
              cpu = "16"
            }
          }
          
          port {
            container_port = 8000
            name = "http"
          }
          
          env_from {
            config_map_ref {
              name = kubernetes_config_map.deployment_config.metadata[0].name
            }
          }
          
          volume_mount {
            name = "model-cache"
            mount_path = "/root/.cache"
          }
          
          liveness_probe {
            http_get {
              path = "/health"
              port = 8000
            }
            initial_delay_seconds = 300
            period_seconds = 30
            timeout_seconds = 10
            failure_threshold = 3
          }
          
          readiness_probe {
            http_get {
              path = "/health"
              port = 8000
            }
            initial_delay_seconds = 60
            period_seconds = 10
            timeout_seconds = 5
            failure_threshold = 3
          }
        }
        
        volume {
          name = "model-cache"
          empty_dir {
            size_limit = "${local.selected_resources.storage_gb}Gi"
          }
        }
      }
    }
  }
}

# Service for vLLM server
resource "kubernetes_service" "vllm_server" {
  metadata {
    name = "vllm-server"
    namespace = kubernetes_namespace.deployment.metadata[0].name
    labels = local.common_labels
  }
  
  spec {
    selector = {
      "app.kubernetes.io/name" = "vllm-server"
      "app.kubernetes.io/instance" = var.deployment_id
    }
    
    port {
      name = "http"
      port = 8000
      target_port = 8000
      protocol = "TCP"
    }
    
    type = "ClusterIP"
  }
}

# Deploy ChromaDB
resource "kubernetes_deployment" "chromadb" {
  metadata {
    name = "chromadb"
    namespace = kubernetes_namespace.deployment.metadata[0].name
    labels = merge(local.common_labels, {
      "app.kubernetes.io/component" = "chromadb"
    })
  }
  
  spec {
    replicas = 1
    
    selector {
      match_labels = {
        "app.kubernetes.io/name" = "chromadb"
        "app.kubernetes.io/instance" = var.deployment_id
      }
    }
    
    template {
      metadata {
        labels = merge(local.common_labels, {
          "app.kubernetes.io/name" = "chromadb"
          "app.kubernetes.io/component" = "chromadb"
        })
      }
      
      spec {
        container {
          name = "chromadb"
          image = "chromadb/chroma:latest"
          
          env {
            name = "CHROMA_DB_IMPL"
            value = "duckdb+parquet"
          }
          
          env {
            name = "PERSIST_DIRECTORY"
            value = "/chroma/chroma"
          }
          
          resources {
            requests = {
              memory = "${var.chromadb_memory_limit_gb}Gi"
              cpu = "2"
            }
            limits = {
              memory = "${var.chromadb_memory_limit_gb * 2}Gi"
              cpu = "4"
            }
          }
          
          port {
            container_port = 8000
            name = "http"
          }
          
          volume_mount {
            name = "chromadb-storage"
            mount_path = "/chroma/chroma"
          }
          
          liveness_probe {
            http_get {
              path = "/api/v1/heartbeat"
              port = 8000
            }
            initial_delay_seconds = 30
            period_seconds = 30
          }
          
          readiness_probe {
            http_get {
              path = "/api/v1/heartbeat"
              port = 8000
            }
            initial_delay_seconds = 15
            period_seconds = 10
          }
        }
        
        volume {
          name = "chromadb-storage"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.chromadb_storage.metadata[0].name
          }
        }
      }
    }
  }
}

# Service for ChromaDB
resource "kubernetes_service" "chromadb" {
  metadata {
    name = "chromadb"
    namespace = kubernetes_namespace.deployment.metadata[0].name
    labels = local.common_labels
  }
  
  spec {
    selector = {
      "app.kubernetes.io/name" = "chromadb"
      "app.kubernetes.io/instance" = var.deployment_id
    }
    
    port {
      name = "http"
      port = 8000
      target_port = 8000
      protocol = "TCP"
    }
    
    type = "ClusterIP"
  }
}

# Deploy PostgreSQL for application data
resource "kubernetes_deployment" "postgres" {
  metadata {
    name = "postgres"
    namespace = kubernetes_namespace.deployment.metadata[0].name
    labels = merge(local.common_labels, {
      "app.kubernetes.io/component" = "postgres"
    })
  }
  
  spec {
    replicas = 1
    
    selector {
      match_labels = {
        "app.kubernetes.io/name" = "postgres"
        "app.kubernetes.io/instance" = var.deployment_id
      }
    }
    
    template {
      metadata {
        labels = merge(local.common_labels, {
          "app.kubernetes.io/name" = "postgres"
          "app.kubernetes.io/component" = "postgres"
        })
      }
      
      spec {
        container {
          name = "postgres"
          image = "postgres:15"
          
          env {
            name = "POSTGRES_DB"
            value = "aiplatform"
          }
          
          env {
            name = "POSTGRES_USER"
            value = "aiplatform"
          }
          
          env {
            name = "POSTGRES_PASSWORD"
            value = random_password.postgres_password.result
          }
          
          resources {
            requests = {
              memory = "2Gi"
              cpu = "1"
            }
            limits = {
              memory = "4Gi"
              cpu = "2"
            }
          }
          
          port {
            container_port = 5432
            name = "postgres"
          }
          
          volume_mount {
            name = "postgres-storage"
            mount_path = "/var/lib/postgresql/data"
          }
          
          liveness_probe {
            exec {
              command = ["pg_isready", "-U", "aiplatform"]
            }
            initial_delay_seconds = 30
            period_seconds = 30
          }
          
          readiness_probe {
            exec {
              command = ["pg_isready", "-U", "aiplatform"]
            }
            initial_delay_seconds = 15
            period_seconds = 10
          }
        }
        
        volume {
          name = "postgres-storage"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.postgres_storage.metadata[0].name
          }
        }
      }
    }
  }
}

# Service for PostgreSQL
resource "kubernetes_service" "postgres" {
  metadata {
    name = "postgres"
    namespace = kubernetes_namespace.deployment.metadata[0].name
    labels = local.common_labels
  }
  
  spec {
    selector = {
      "app.kubernetes.io/name" = "postgres"
      "app.kubernetes.io/instance" = var.deployment_id
    }
    
    port {
      name = "postgres"
      port = 5432
      target_port = 5432
      protocol = "TCP"
    }
    
    type = "ClusterIP"
  }
}

# Generate random passwords
resource "random_password" "postgres_password" {
  length = 32
  special = true
}

# Create ingress for external access
resource "kubernetes_ingress_v1" "api_ingress" {
  metadata {
    name = "api-ingress"
    namespace = kubernetes_namespace.deployment.metadata[0].name
    labels = local.common_labels
    annotations = {
      "kubernetes.io/ingress.class" = "nginx"
      "cert-manager.io/cluster-issuer" = "letsencrypt-prod"
      "nginx.ingress.kubernetes.io/ssl-redirect" = "true"
      "nginx.ingress.kubernetes.io/backend-protocol" = "HTTP"
    }
  }
  
  spec {
    tls {
      hosts = ["api-${var.deployment_id}.coreweave.cloud"]
      secret_name = "api-tls"
    }
    
    rule {
      host = "api-${var.deployment_id}.coreweave.cloud"
      
      http {
        path {
          path = "/"
          path_type = "Prefix"
          
          backend {
            service {
              name = kubernetes_service.vllm_server.metadata[0].name
              port {
                number = 8000
              }
            }
          }
        }
      }
    }
  }
}