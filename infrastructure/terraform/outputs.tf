# Output values for AI Infrastructure Platform deployment

# Deployment information
output "deployment_id" {
  description = "Deployment unique identifier"
  value       = var.deployment_id
}

output "deployment_name" {
  description = "Deployment name"
  value       = var.deployment_name
}

output "cloud_provider" {
  description = "Cloud provider used"
  value       = var.cloud_provider
}

output "region" {
  description = "Deployment region"
  value       = var.region
}

# Infrastructure endpoints
output "cluster_endpoint" {
  description = "Kubernetes cluster endpoint"
  value = try(
    module.coreweave_deployment[0].cluster_endpoint,
    module.aws_deployment[0].cluster_endpoint,
    module.gcp_deployment[0].cluster_endpoint,
    ""
  )
  sensitive = true
}

output "api_endpoint" {
  description = "AI model API endpoint"
  value = module.ai_services.api_endpoint
}

output "chat_ui_url" {
  description = "Streamlit chat UI URL"
  value = module.ai_services.chat_ui_url
}

output "n8n_url" {
  description = "n8n workflow automation URL"
  value = module.ai_services.n8n_url
}

output "monitoring_url" {
  description = "Monitoring dashboard URL"
  value = module.ai_services.monitoring_url
}

# Storage information
output "storage_bucket" {
  description = "Document storage bucket/container"
  value = try(
    module.coreweave_deployment[0].storage_bucket,
    module.aws_deployment[0].storage_bucket,
    module.gcp_deployment[0].storage_bucket,
    ""
  )
}

output "storage_endpoint" {
  description = "Storage endpoint URL"
  value = try(
    module.coreweave_deployment[0].storage_endpoint,
    module.aws_deployment[0].storage_endpoint,
    module.gcp_deployment[0].storage_endpoint,
    ""
  )
}

# Database information
output "chromadb_endpoint" {
  description = "ChromaDB vector database endpoint"
  value = module.ai_services.chromadb_endpoint
  sensitive = true
}

output "postgres_endpoint" {
  description = "PostgreSQL database endpoint"
  value = try(
    module.coreweave_deployment[0].postgres_endpoint,
    module.aws_deployment[0].postgres_endpoint,
    module.gcp_deployment[0].postgres_endpoint,
    ""
  )
  sensitive = true
}

# Access credentials
output "api_key" {
  description = "API key for accessing deployed services"
  value = module.ai_services.api_key
  sensitive = true
}

output "admin_username" {
  description = "Admin username for services"
  value = module.ai_services.admin_username
  sensitive = true
}

output "admin_password" {
  description = "Admin password for services"
  value = module.ai_services.admin_password
  sensitive = true
}

output "n8n_admin_credentials" {
  description = "n8n admin access credentials"
  value = module.ai_services.n8n_admin_credentials
  sensitive = true
}

# Network information
output "vpc_id" {
  description = "VPC/Network ID"
  value = try(
    module.coreweave_deployment[0].vpc_id,
    module.aws_deployment[0].vpc_id,
    module.gcp_deployment[0].network_id,
    ""
  )
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value = try(
    module.coreweave_deployment[0].private_subnet_ids,
    module.aws_deployment[0].private_subnet_ids,
    module.gcp_deployment[0].private_subnet_ids,
    []
  )
}

output "security_group_ids" {
  description = "Security group IDs"
  value = try(
    module.coreweave_deployment[0].security_group_ids,
    module.aws_deployment[0].security_group_ids,
    module.gcp_deployment[0].firewall_rule_ids,
    []
  )
}

# SSL/TLS information
output "ssl_certificate" {
  description = "SSL certificate information"
  value = {
    arn = try(
      module.aws_deployment[0].ssl_certificate_arn,
      module.gcp_deployment[0].ssl_certificate_id,
      ""
    )
    domain = var.domain_name
  }
}

# Cost information
output "estimated_hourly_cost" {
  description = "Estimated hourly cost in USD"
  value = try(
    module.coreweave_deployment[0].estimated_hourly_cost,
    module.aws_deployment[0].estimated_hourly_cost,
    module.gcp_deployment[0].estimated_hourly_cost,
    0
  )
}

output "estimated_monthly_cost" {
  description = "Estimated monthly cost in USD"
  value = try(
    module.coreweave_deployment[0].estimated_monthly_cost,
    module.aws_deployment[0].estimated_monthly_cost,
    module.gcp_deployment[0].estimated_monthly_cost,
    0
  )
}

# Resource information
output "gpu_instances" {
  description = "GPU instance information"
  value = try(
    module.coreweave_deployment[0].gpu_instances,
    module.aws_deployment[0].gpu_instances,
    module.gcp_deployment[0].gpu_instances,
    {}
  )
}

output "kubernetes_nodes" {
  description = "Kubernetes node information"
  value = try(
    module.coreweave_deployment[0].kubernetes_nodes,
    module.aws_deployment[0].kubernetes_nodes,
    module.gcp_deployment[0].kubernetes_nodes,
    []
  )
}

# AI model information
output "model_info" {
  description = "Deployed AI model information"
  value = {
    model_size = var.model_size
    gpu_type = var.gpu_type
    gpu_count = var.gpu_count
    quantization = var.model_quantization
    max_concurrent_requests = var.max_concurrent_requests
  }
}

# Industry configuration
output "industry_config" {
  description = "Industry-specific configuration applied"
  value = module.industry_config.applied_configuration
}

output "compliance_features" {
  description = "Compliance features enabled"
  value = module.industry_config.compliance_features
}

# Monitoring information
output "monitoring_endpoints" {
  description = "Monitoring service endpoints"
  value = module.ai_services.monitoring_endpoints
}

output "log_endpoints" {
  description = "Log aggregation endpoints"
  value = module.ai_services.log_endpoints
}

# Backup information
output "backup_configuration" {
  description = "Backup configuration details"
  value = {
    enabled = true
    retention_days = var.backup_retention_days
    backup_bucket = try(
      module.coreweave_deployment[0].backup_bucket,
      module.aws_deployment[0].backup_bucket,
      module.gcp_deployment[0].backup_bucket,
      ""
    )
  }
}

# Scaling information
output "autoscaling_configuration" {
  description = "Auto-scaling configuration"
  value = {
    enabled = var.enable_autoscaling
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas
    target_cpu_utilization = var.target_cpu_utilization
  }
}

# Service status
output "service_status" {
  description = "Status of deployed services"
  value = module.ai_services.service_status
}

# Integration endpoints
output "integration_endpoints" {
  description = "Integration service endpoints"
  value = {
    webhook_url = module.ai_services.webhook_url
    api_docs_url = module.ai_services.api_docs_url
    health_check_url = module.ai_services.health_check_url
  }
}

# Deployment metadata
output "deployment_metadata" {
  description = "Deployment metadata and tags"
  value = {
    deployment_id = var.deployment_id
    deployment_name = var.deployment_name
    cloud_provider = var.cloud_provider
    region = var.region
    industry_template = var.industry_template
    created_at = timestamp()
    terraform_version = "1.0+"
    tags = {
      DeploymentId = var.deployment_id
      CloudProvider = var.cloud_provider
      Industry = var.industry_template
      ManagedBy = "ai-platform"
      Environment = var.environment
    }
  }
}