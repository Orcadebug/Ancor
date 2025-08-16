# Input variables for AI Infrastructure Platform deployment

variable "deployment_id" {
  description = "Unique identifier for this deployment"
  type        = string
  validation {
    condition     = can(regex("^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$", var.deployment_id))
    error_message = "Deployment ID must be a valid UUID."
  }
}

variable "deployment_name" {
  description = "Human-readable name for the deployment"
  type        = string
  validation {
    condition     = length(var.deployment_name) > 0 && length(var.deployment_name) <= 255
    error_message = "Deployment name must be between 1 and 255 characters."
  }
}

variable "cloud_provider" {
  description = "Cloud provider for deployment"
  type        = string
  validation {
    condition     = contains(["coreweave", "aws", "gcp"], var.cloud_provider)
    error_message = "Cloud provider must be one of: coreweave, aws, gcp."
  }
}

variable "region" {
  description = "Cloud provider region"
  type        = string
}

variable "industry_template" {
  description = "Industry-specific template for deployment"
  type        = string
  validation {
    condition     = contains(["legal", "healthcare", "finance", "professional_services"], var.industry_template)
    error_message = "Industry template must be one of: legal, healthcare, finance, professional_services."
  }
}

variable "model_size" {
  description = "LLaMA model size to deploy"
  type        = string
  validation {
    condition     = contains(["8b", "70b", "405b"], var.model_size)
    error_message = "Model size must be one of: 8b, 70b, 405b."
  }
}

variable "gpu_type" {
  description = "GPU type for model inference"
  type        = string
  default     = "A100"
}

variable "gpu_count" {
  description = "Number of GPUs to provision"
  type        = number
  default     = 1
  validation {
    condition     = var.gpu_count >= 1 && var.gpu_count <= 16
    error_message = "GPU count must be between 1 and 16."
  }
}

variable "compliance_requirements" {
  description = "List of compliance requirements"
  type        = list(string)
  default     = []
}

variable "environment" {
  description = "Environment (production, staging, development)"
  type        = string
  default     = "production"
}

# CoreWeave specific variables
variable "coreweave_api_key" {
  description = "CoreWeave API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "coreweave_org_id" {
  description = "CoreWeave organization ID"
  type        = string
  default     = ""
}

# AWS specific variables
variable "aws_access_key_id" {
  description = "AWS access key ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "aws_secret_access_key" {
  description = "AWS secret access key"
  type        = string
  sensitive   = true
  default     = ""
}

# GCP specific variables
variable "gcp_project_id" {
  description = "GCP project ID"
  type        = string
  default     = ""
}

variable "gcp_credentials" {
  description = "GCP service account credentials JSON"
  type        = string
  sensitive   = true
  default     = ""
}

# Kubernetes configuration
variable "kubernetes_config_path" {
  description = "Path to Kubernetes config file"
  type        = string
  default     = "~/.kube/config"
}

# Network configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

# Storage configuration
variable "storage_size_gb" {
  description = "Storage size in GB for document storage"
  type        = number
  default     = 1000
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

# AI model configuration
variable "model_quantization" {
  description = "Model quantization level (fp16, int8, int4)"
  type        = string
  default     = "fp16"
  validation {
    condition     = contains(["fp16", "int8", "int4"], var.model_quantization)
    error_message = "Model quantization must be one of: fp16, int8, int4."
  }
}

variable "max_concurrent_requests" {
  description = "Maximum concurrent requests for model inference"
  type        = number
  default     = 100
}

variable "model_cache_size_gb" {
  description = "Model cache size in GB"
  type        = number
  default     = 50
}

# ChromaDB configuration
variable "chromadb_storage_size_gb" {
  description = "ChromaDB storage size in GB"
  type        = number
  default     = 100
}

variable "chromadb_memory_limit_gb" {
  description = "ChromaDB memory limit in GB"
  type        = number
  default     = 8
}

# n8n configuration
variable "n8n_storage_size_gb" {
  description = "n8n workflow storage size in GB"
  type        = number
  default     = 20
}

variable "n8n_admin_email" {
  description = "n8n admin email"
  type        = string
  default     = ""
}

# Monitoring configuration
variable "enable_monitoring" {
  description = "Enable monitoring stack (Prometheus, Grafana)"
  type        = bool
  default     = true
}

variable "monitoring_retention_days" {
  description = "Monitoring data retention in days"
  type        = number
  default     = 15
}

# Security configuration
variable "enable_network_policies" {
  description = "Enable Kubernetes network policies"
  type        = bool
  default     = true
}

variable "enable_pod_security_policies" {
  description = "Enable pod security policies"
  type        = bool
  default     = true
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access the deployment"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# SSL/TLS configuration
variable "domain_name" {
  description = "Domain name for the deployment (optional)"
  type        = string
  default     = ""
}

variable "ssl_certificate_arn" {
  description = "SSL certificate ARN (AWS only)"
  type        = string
  default     = ""
}

# Auto-scaling configuration
variable "enable_autoscaling" {
  description = "Enable auto-scaling for inference pods"
  type        = bool
  default     = true
}

variable "min_replicas" {
  description = "Minimum number of inference replicas"
  type        = number
  default     = 1
}

variable "max_replicas" {
  description = "Maximum number of inference replicas"
  type        = number
  default     = 10
}

variable "target_cpu_utilization" {
  description = "Target CPU utilization for auto-scaling"
  type        = number
  default     = 70
}

# Logging configuration
variable "log_level" {
  description = "Application log level"
  type        = string
  default     = "INFO"
  validation {
    condition     = contains(["DEBUG", "INFO", "WARN", "ERROR"], var.log_level)
    error_message = "Log level must be one of: DEBUG, INFO, WARN, ERROR."
  }
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 7
}