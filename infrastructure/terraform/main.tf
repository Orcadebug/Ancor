# AI Infrastructure Management Platform - Main Terraform Configuration

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }

  backend "s3" {
    # Backend configuration will be provided during terraform init
    # bucket = "ai-platform-terraform-state"
    # key    = "deployments/${deployment_id}/terraform.tfstate"
    # region = "us-east-1"
  }
}

# Local variables
locals {
  deployment_id = var.deployment_id
  deployment_name = var.deployment_name
  cloud_provider = var.cloud_provider
  
  common_tags = {
    DeploymentId = local.deployment_id
    DeploymentName = local.deployment_name
    CloudProvider = local.cloud_provider
    Industry = var.industry_template
    ManagedBy = "ai-platform"
    Environment = var.environment
  }
}

# Data sources for current deployment state
data "external" "deployment_config" {
  program = ["python3", "${path.module}/scripts/get_deployment_config.py"]
  query = {
    deployment_id = var.deployment_id
  }
}

# Deploy based on cloud provider
module "coreweave_deployment" {
  count = var.cloud_provider == "coreweave" ? 1 : 0
  source = "./modules/coreweave"
  
  deployment_id = local.deployment_id
  deployment_name = local.deployment_name
  model_size = var.model_size
  gpu_type = var.gpu_type
  gpu_count = var.gpu_count
  region = var.region
  industry_template = var.industry_template
  compliance_requirements = var.compliance_requirements
  
  tags = local.common_tags
}

module "aws_deployment" {
  count = var.cloud_provider == "aws" ? 1 : 0
  source = "./modules/aws"
  
  deployment_id = local.deployment_id
  deployment_name = local.deployment_name
  model_size = var.model_size
  gpu_type = var.gpu_type
  gpu_count = var.gpu_count
  region = var.region
  industry_template = var.industry_template
  compliance_requirements = var.compliance_requirements
  
  tags = local.common_tags
}

module "gcp_deployment" {
  count = var.cloud_provider == "gcp" ? 1 : 0
  source = "./modules/gcp"
  
  deployment_id = local.deployment_id
  deployment_name = local.deployment_name
  model_size = var.model_size
  gpu_type = var.gpu_type
  gpu_count = var.gpu_count
  region = var.region
  industry_template = var.industry_template
  compliance_requirements = var.compliance_requirements
  
  tags = local.common_tags
}

# Industry-specific configuration
module "industry_config" {
  source = "./modules/industry"
  
  deployment_id = local.deployment_id
  industry_template = var.industry_template
  compliance_requirements = var.compliance_requirements
  cloud_provider = var.cloud_provider
  
  # Infrastructure outputs from cloud provider modules
  cluster_endpoint = try(
    module.coreweave_deployment[0].cluster_endpoint,
    module.aws_deployment[0].cluster_endpoint,
    module.gcp_deployment[0].cluster_endpoint,
    ""
  )
  
  cluster_ca_certificate = try(
    module.coreweave_deployment[0].cluster_ca_certificate,
    module.aws_deployment[0].cluster_ca_certificate,
    module.gcp_deployment[0].cluster_ca_certificate,
    ""
  )
  
  cluster_token = try(
    module.coreweave_deployment[0].cluster_token,
    module.aws_deployment[0].cluster_token,
    module.gcp_deployment[0].cluster_token,
    ""
  )
}

# AI Services deployment
module "ai_services" {
  source = "./modules/ai-services"
  
  deployment_id = local.deployment_id
  deployment_name = local.deployment_name
  model_size = var.model_size
  gpu_count = var.gpu_count
  industry_template = var.industry_template
  
  # Infrastructure dependencies
  cluster_endpoint = try(
    module.coreweave_deployment[0].cluster_endpoint,
    module.aws_deployment[0].cluster_endpoint,
    module.gcp_deployment[0].cluster_endpoint,
    ""
  )
  
  cluster_ca_certificate = try(
    module.coreweave_deployment[0].cluster_ca_certificate,
    module.aws_deployment[0].cluster_ca_certificate,
    module.gcp_deployment[0].cluster_ca_certificate,
    ""
  )
  
  cluster_token = try(
    module.coreweave_deployment[0].cluster_token,
    module.aws_deployment[0].cluster_token,
    module.gcp_deployment[0].cluster_token,
    ""
  )
  
  storage_bucket = try(
    module.coreweave_deployment[0].storage_bucket,
    module.aws_deployment[0].storage_bucket,
    module.gcp_deployment[0].storage_bucket,
    ""
  )
  
  depends_on = [
    module.coreweave_deployment,
    module.aws_deployment,
    module.gcp_deployment,
    module.industry_config
  ]
}