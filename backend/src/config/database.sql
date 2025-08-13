-- AI Infrastructure Management Platform MVP Database Schema
-- PostgreSQL Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- AI Models configuration
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'meta', 'custom'
    model_id VARCHAR(100) NOT NULL, -- 'gpt-4', 'claude-3', 'llama-2', etc.
    description TEXT,
    pricing_per_token DECIMAL(10, 8),
    max_tokens INTEGER,
    supported_features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cloud providers configuration
CREATE TABLE cloud_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL, -- 'aws', 'gcp', 'azure'
    display_name VARCHAR(100) NOT NULL,
    regions JSONB NOT NULL, -- Array of available regions
    instance_types JSONB NOT NULL, -- Available instance configurations
    pricing_info JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User API Keys (encrypted storage)
CREATE TABLE user_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'aws', 'gcp', 'azure', 'openai', etc.
    key_name VARCHAR(100) NOT NULL,
    encrypted_key TEXT NOT NULL, -- Encrypted API key
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, provider, key_name)
);

-- Deployments
CREATE TABLE deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- AI Model Configuration
    ai_model_id UUID NOT NULL REFERENCES ai_models(id),
    model_config JSONB NOT NULL, -- Performance presets, custom parameters
    
    -- Infrastructure Configuration
    cloud_provider_id UUID NOT NULL REFERENCES cloud_providers(id),
    region VARCHAR(100) NOT NULL,
    instance_type VARCHAR(100) NOT NULL,
    
    -- Configuration Settings
    rate_limit INTEGER DEFAULT 100, -- Requests per minute
    security_config JSONB NOT NULL, -- IP allowlist, authentication settings
    
    -- Deployment Status
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'deploying', 'running', 'stopped', 'failed', 'terminated'
    cloud_instance_id VARCHAR(255), -- Provider-specific instance ID
    endpoint_url TEXT, -- API endpoint once deployed
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deployed_at TIMESTAMP WITH TIME ZONE,
    last_health_check TIMESTAMP WITH TIME ZONE
);

-- Deployment metrics (time-series data)
CREATE TABLE deployment_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Performance Metrics
    response_time_ms INTEGER,
    requests_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5, 2), -- Percentage
    
    -- Resource Metrics
    cpu_usage DECIMAL(5, 2), -- Percentage
    memory_usage DECIMAL(5, 2), -- Percentage
    disk_usage DECIMAL(5, 2), -- Percentage
    network_in_mb DECIMAL(10, 2),
    network_out_mb DECIMAL(10, 2),
    
    -- Cost Metrics
    cost_usd DECIMAL(10, 4) DEFAULT 0
);

-- Usage analytics (aggregated data)
CREATE TABLE usage_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Daily aggregates
    total_requests INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    avg_response_time_ms DECIMAL(8, 2),
    total_cost_usd DECIMAL(10, 4) DEFAULT 0,
    
    -- Token usage (for AI models)
    input_tokens_used BIGINT DEFAULT 0,
    output_tokens_used BIGINT DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(deployment_id, date)
);

-- System logs
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID REFERENCES deployments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    level VARCHAR(10) NOT NULL, -- 'INFO', 'WARN', 'ERROR', 'DEBUG'
    message TEXT NOT NULL,
    context JSONB, -- Additional context data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts configuration
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deployment_id UUID REFERENCES deployments(id) ON DELETE CASCADE,
    
    alert_type VARCHAR(50) NOT NULL, -- 'performance', 'cost', 'security', 'maintenance'
    name VARCHAR(255) NOT NULL,
    condition_config JSONB NOT NULL, -- Threshold conditions
    
    -- Notification settings
    notification_channels JSONB, -- email, slack, webhook, etc.
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert incidents (triggered alerts)
CREATE TABLE alert_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    deployment_id UUID REFERENCES deployments(id) ON DELETE CASCADE,
    
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'resolved', 'acknowledged'
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Backups
CREATE TABLE backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    backup_type VARCHAR(50) NOT NULL, -- 'manual', 'scheduled', 'auto'
    
    -- Backup metadata
    size_mb DECIMAL(10, 2),
    storage_location TEXT NOT NULL, -- Cloud storage path
    checksum VARCHAR(255),
    
    status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_deployments_user_id ON deployments(user_id);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_created_at ON deployments(created_at);

CREATE INDEX idx_deployment_metrics_deployment_id ON deployment_metrics(deployment_id);
CREATE INDEX idx_deployment_metrics_timestamp ON deployment_metrics(timestamp);

CREATE INDEX idx_usage_analytics_user_id ON usage_analytics(user_id);
CREATE INDEX idx_usage_analytics_deployment_id ON usage_analytics(deployment_id);
CREATE INDEX idx_usage_analytics_date ON usage_analytics(date);

CREATE INDEX idx_system_logs_deployment_id ON system_logs(deployment_id);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);

CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_deployment_id ON alerts(deployment_id);

CREATE INDEX idx_alert_incidents_alert_id ON alert_incidents(alert_id);
CREATE INDEX idx_alert_incidents_status ON alert_incidents(status);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployments_updated_at BEFORE UPDATE ON deployments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at BEFORE UPDATE ON user_api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default AI models
INSERT INTO ai_models (name, provider, model_id, description, pricing_per_token, max_tokens, supported_features) VALUES
('GPT-4', 'openai', 'gpt-4', 'Most capable OpenAI model for complex tasks', 0.00003, 8192, '{"chat": true, "completion": true, "function_calling": true}'),
('GPT-3.5 Turbo', 'openai', 'gpt-3.5-turbo', 'Fast and cost-effective OpenAI model', 0.0000015, 4096, '{"chat": true, "completion": true, "function_calling": true}'),
('Claude 3 Opus', 'anthropic', 'claude-3-opus-20240229', 'Most powerful Claude model', 0.000015, 200000, '{"chat": true, "completion": true, "vision": true}'),
('Claude 3 Sonnet', 'anthropic', 'claude-3-sonnet-20240229', 'Balanced Claude model', 0.000003, 200000, '{"chat": true, "completion": true, "vision": true}'),
('Llama 2 70B', 'meta', 'llama-2-70b', 'Large open-source model', 0.000001, 4096, '{"chat": true, "completion": true}');

-- Insert default cloud providers
INSERT INTO cloud_providers (name, display_name, regions, instance_types, pricing_info) VALUES
('aws', 'Amazon Web Services', 
 '["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]',
 '{"t3.micro": {"cpu": 2, "memory": 1}, "t3.small": {"cpu": 2, "memory": 2}, "m5.large": {"cpu": 2, "memory": 8}, "m5.xlarge": {"cpu": 4, "memory": 16}}',
 '{"compute": {"t3.micro": 0.0104, "t3.small": 0.0208, "m5.large": 0.096, "m5.xlarge": 0.192}}'
),
('gcp', 'Google Cloud Platform',
 '["us-central1", "us-west1", "europe-west1", "asia-southeast1"]',
 '{"e2-micro": {"cpu": 2, "memory": 1}, "e2-small": {"cpu": 2, "memory": 2}, "n1-standard-2": {"cpu": 2, "memory": 7.5}, "n1-standard-4": {"cpu": 4, "memory": 15}}',
 '{"compute": {"e2-micro": 0.008, "e2-small": 0.017, "n1-standard-2": 0.095, "n1-standard-4": 0.19}}'
),
('azure', 'Microsoft Azure',
 '["eastus", "westus2", "westeurope", "southeastasia"]',
 '{"B1ls": {"cpu": 1, "memory": 0.5}, "B1s": {"cpu": 1, "memory": 1}, "B2s": {"cpu": 2, "memory": 4}, "B4ms": {"cpu": 4, "memory": 16}}',
 '{"compute": {"B1ls": 0.0052, "B1s": 0.0104, "B2s": 0.0416, "B4ms": 0.166}}'
);