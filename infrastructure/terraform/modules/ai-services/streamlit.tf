# Streamlit Chat UI deployment for AI Platform

# Streamlit ConfigMap
resource "kubernetes_config_map" "streamlit_config" {
  metadata {
    name      = "streamlit-config"
    namespace = var.namespace
    labels    = var.common_labels
  }

  data = {
    API_ENDPOINT     = var.api_endpoint
    DEPLOYMENT_ID    = var.deployment_id
    DEPLOYMENT_NAME  = var.deployment_name
    INDUSTRY_TEMPLATE = var.industry_template
    LOG_LEVEL       = "INFO"
    STREAMLIT_SERVER_PORT = "8501"
    STREAMLIT_SERVER_ADDRESS = "0.0.0.0"
    STREAMLIT_SERVER_HEADLESS = "true"
    STREAMLIT_BROWSER_GATHER_USAGE_STATS = "false"
  }
}

# Streamlit Secret for API key
resource "kubernetes_secret" "streamlit_secret" {
  metadata {
    name      = "streamlit-secret"
    namespace = var.namespace
    labels    = var.common_labels
  }

  data = {
    API_KEY = var.api_key
  }

  type = "Opaque"
}

# Streamlit Deployment
resource "kubernetes_deployment" "streamlit" {
  metadata {
    name      = "streamlit-chat"
    namespace = var.namespace
    labels = merge(var.common_labels, {
      "app.kubernetes.io/component" = "streamlit-chat"
    })
  }

  spec {
    replicas = var.streamlit_replicas

    selector {
      match_labels = {
        "app.kubernetes.io/name"     = "streamlit-chat"
        "app.kubernetes.io/instance" = var.deployment_id
      }
    }

    template {
      metadata {
        labels = merge(var.common_labels, {
          "app.kubernetes.io/name"      = "streamlit-chat"
          "app.kubernetes.io/component" = "streamlit-chat"
        })
      }

      spec {
        container {
          name  = "streamlit-chat"
          image = var.streamlit_image

          port {
            name           = "http"
            container_port = 8501
            protocol       = "TCP"
          }

          env_from {
            config_map_ref {
              name = kubernetes_config_map.streamlit_config.metadata[0].name
            }
          }

          env_from {
            secret_ref {
              name = kubernetes_secret.streamlit_secret.metadata[0].name
            }
          }

          # Resource limits
          resources {
            requests = {
              memory = "512Mi"
              cpu    = "250m"
            }
            limits = {
              memory = "1Gi"
              cpu    = "500m"
            }
          }

          # Health checks
          liveness_probe {
            http_get {
              path = "/_stcore/health"
              port = 8501
            }
            initial_delay_seconds = 30
            period_seconds        = 30
            timeout_seconds       = 10
            failure_threshold     = 3
          }

          readiness_probe {
            http_get {
              path = "/_stcore/health"
              port = 8501
            }
            initial_delay_seconds = 10
            period_seconds        = 10
            timeout_seconds       = 5
            failure_threshold     = 3
          }

          # Volume mounts for uploads (optional)
          volume_mount {
            name       = "uploads"
            mount_path = "/app/uploads"
          }

          volume_mount {
            name       = "logs"
            mount_path = "/app/logs"
          }
        }

        # Volumes
        volume {
          name = "uploads"
          empty_dir {
            size_limit = "1Gi"
          }
        }

        volume {
          name = "logs"
          empty_dir {
            size_limit = "100Mi"
          }
        }
      }
    }
  }

  depends_on = [
    kubernetes_config_map.streamlit_config,
    kubernetes_secret.streamlit_secret
  ]
}

# Streamlit Service
resource "kubernetes_service" "streamlit" {
  metadata {
    name      = "streamlit-chat"
    namespace = var.namespace
    labels    = var.common_labels
  }

  spec {
    selector = {
      "app.kubernetes.io/name"     = "streamlit-chat"
      "app.kubernetes.io/instance" = var.deployment_id
    }

    port {
      name        = "http"
      port        = 8501
      target_port = 8501
      protocol    = "TCP"
    }

    type = "ClusterIP"
  }
}

# Ingress for Streamlit Chat UI
resource "kubernetes_ingress_v1" "streamlit" {
  metadata {
    name      = "streamlit-chat-ingress"
    namespace = var.namespace
    labels    = var.common_labels
    annotations = {
      "kubernetes.io/ingress.class"                = "nginx"
      "cert-manager.io/cluster-issuer"            = "letsencrypt-prod"
      "nginx.ingress.kubernetes.io/ssl-redirect"   = "true"
      "nginx.ingress.kubernetes.io/backend-protocol" = "HTTP"
      "nginx.ingress.kubernetes.io/proxy-read-timeout" = "300"
      "nginx.ingress.kubernetes.io/proxy-send-timeout" = "300"
      "nginx.ingress.kubernetes.io/client-max-body-size" = "50m"
      # Streamlit specific annotations
      "nginx.ingress.kubernetes.io/upstream-hash-by" = "$arg_session_id"
      "nginx.ingress.kubernetes.io/proxy-buffering" = "off"
    }
  }

  spec {
    tls {
      hosts       = [var.chat_ui_domain]
      secret_name = "streamlit-chat-tls"
    }

    rule {
      host = var.chat_ui_domain

      http {
        path {
          path      = "/"
          path_type = "Prefix"

          backend {
            service {
              name = kubernetes_service.streamlit.metadata[0].name
              port {
                number = 8501
              }
            }
          }
        }
      }
    }
  }
}

# Horizontal Pod Autoscaler for Streamlit
resource "kubernetes_horizontal_pod_autoscaler_v2" "streamlit" {
  count = var.enable_autoscaling ? 1 : 0

  metadata {
    name      = "streamlit-chat-hpa"
    namespace = var.namespace
    labels    = var.common_labels
  }

  spec {
    scale_target_ref {
      api_version = "apps/v1"
      kind        = "Deployment"
      name        = kubernetes_deployment.streamlit.metadata[0].name
    }

    min_replicas = var.streamlit_min_replicas
    max_replicas = var.streamlit_max_replicas

    metric {
      type = "Resource"
      resource {
        name = "cpu"
        target {
          type                = "Utilization"
          average_utilization = var.target_cpu_utilization
        }
      }
    }

    metric {
      type = "Resource"
      resource {
        name = "memory"
        target {
          type                = "Utilization"
          average_utilization = 80
        }
      }
    }
  }
}

# NetworkPolicy for Streamlit (if network policies are enabled)
resource "kubernetes_network_policy" "streamlit" {
  count = var.enable_network_policies ? 1 : 0

  metadata {
    name      = "streamlit-chat-network-policy"
    namespace = var.namespace
    labels    = var.common_labels
  }

  spec {
    pod_selector {
      match_labels = {
        "app.kubernetes.io/name"     = "streamlit-chat"
        "app.kubernetes.io/instance" = var.deployment_id
      }
    }

    policy_types = ["Ingress", "Egress"]

    ingress {
      from {
        # Allow ingress from nginx ingress controller
        namespace_selector {
          match_labels = {
            name = "ingress-nginx"
          }
        }
      }

      ports {
        protocol = "TCP"
        port     = "8501"
      }
    }

    egress {
      # Allow egress to API services
      to {
        pod_selector {
          match_labels = {
            "app.kubernetes.io/component" = "api-server"
          }
        }
      }

      ports {
        protocol = "TCP"
        port     = "8000"
      }
    }

    egress {
      # Allow DNS resolution
      to {}
      
      ports {
        protocol = "UDP"
        port     = "53"
      }
    }

    egress {
      # Allow HTTPS outbound (for external APIs if needed)
      to {}
      
      ports {
        protocol = "TCP"
        port     = "443"
      }
    }
  }
}

# Variables for Streamlit configuration
variable "streamlit_image" {
  description = "Streamlit chat UI Docker image"
  type        = string
  default     = "ai-platform/streamlit-chat:latest"
}

variable "streamlit_replicas" {
  description = "Number of Streamlit replicas"
  type        = number
  default     = 1
}

variable "streamlit_min_replicas" {
  description = "Minimum number of Streamlit replicas for autoscaling"
  type        = number
  default     = 1
}

variable "streamlit_max_replicas" {
  description = "Maximum number of Streamlit replicas for autoscaling"
  type        = number
  default     = 5
}

variable "chat_ui_domain" {
  description = "Domain for the chat UI"
  type        = string
  default     = ""
}

# Outputs
output "streamlit_service_name" {
  description = "Streamlit service name"
  value       = kubernetes_service.streamlit.metadata[0].name
}

output "streamlit_service_port" {
  description = "Streamlit service port"
  value       = kubernetes_service.streamlit.spec[0].port[0].port
}

output "chat_ui_url" {
  description = "Chat UI URL"
  value       = var.chat_ui_domain != "" ? "https://${var.chat_ui_domain}" : "http://${kubernetes_service.streamlit.metadata[0].name}:8501"
}