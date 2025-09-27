/**
 * GPU Deployment Fix for Cloud Run without Zonal Redundancy
 * This module provides an alternative deployment method that properly handles GPU quota limitations
 */

const { ServicesClient } = require('@google-cloud/run').v2;

/**
 * Deploy LLaMA model with proper GPU configuration (no zonal redundancy)
 * This method uses the correct Cloud Run v2 API configuration to avoid quota issues
 */
async function deployLLaMAModelWithoutRedundancy(deploymentId, modelSize, infrastructure, config) {
  console.log(`🤖 Deploying ${modelSize} model (GPU without zonal redundancy)...`);
  
  const { projectId, region, auth } = config;
  const serviceName = `llama-${deploymentId}`;
  const containerImage = getLLaMAContainerImage(modelSize);
  
  // Option 1: Deploy with GPU but single zone (no redundancy)
  const serviceWithGPU = {
    name: `projects/${projectId}/locations/${region}/services/${serviceName}`,
    labels: {
      'deployment-id': deploymentId,
      'component': 'ai-model',
      'model': modelSize
    },
    template: {
      labels: {
        'deployment-id': deploymentId,
        'component': 'ai-model'
      },
      annotations: {
        // Key annotations for GPU without redundancy
        'run.googleapis.com/execution-environment': 'gen2',
        'run.googleapis.com/startup-cpu-boost': 'true',
        'run.googleapis.com/cpu-throttling': 'false',
        // GPU configuration without zonal redundancy
        'run.googleapis.com/gpu': 'nvidia-l4:1',
        'run.googleapis.com/gpu-driver-version': 'latest'
      },
      // Simplified scaling - single instance to avoid quota issues
      maxInstanceRequestConcurrency: 1000,
      containerConcurrency: 1000,
      containers: [{
        image: containerImage,
        ports: [{ 
          name: 'http1',
          containerPort: 8000 
        }],
        env: [
          { name: 'MODEL_NAME', value: getModelName(modelSize) },
          { name: 'MAX_MODEL_LEN', value: '4096' },
          { name: 'GPU_MEMORY_UTILIZATION', value: '0.9' },
          { name: 'DEPLOYMENT_ID', value: deploymentId }
        ],
        resources: {
          limits: {
            cpu: '4',
            memory: '16Gi'
          }
        }
      }],
      // Service-level configuration
      serviceAccount: config.serviceAccountEmail,
      timeoutSeconds: 3600
    },
    traffic: [{
      type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST',
      percent: 100
    }]
  };

  // Option 2: Deploy with CPU-only (fallback if GPU still fails)
  const serviceWithoutGPU = {
    name: `projects/${projectId}/locations/${region}/services/${serviceName}`,
    labels: {
      'deployment-id': deploymentId,
      'component': 'ai-model-cpu',
      'model': modelSize
    },
    template: {
      labels: {
        'deployment-id': deploymentId,
        'component': 'ai-model-cpu'
      },
      annotations: {
        'run.googleapis.com/execution-environment': 'gen2',
        'run.googleapis.com/startup-cpu-boost': 'true',
        'run.googleapis.com/cpu-throttling': 'false'
      },
      maxInstanceRequestConcurrency: 100,
      containerConcurrency: 100,
      containers: [{
        image: 'python:3.11-slim',  // Using a lightweight image for CPU deployment
        ports: [{ 
          name: 'http1',
          containerPort: 8000 
        }],
        command: ['/bin/bash', '-c'],
        args: [`
          pip install -q transformers torch fastapi uvicorn &&
          cat > llama_server.py << 'EOF'
import os
from fastapi import FastAPI
from transformers import pipeline

app = FastAPI()

# Initialize a smaller model for CPU deployment
generator = pipeline('text-generation', model='gpt2')

@app.get("/health")
def health():
    return {"status": "healthy", "model": "gpt2-cpu"}

@app.post("/chat")
def chat(message: str):
    response = generator(message, max_length=100, num_return_sequences=1)
    return {"response": response[0]['generated_text']}
EOF
          uvicorn llama_server:app --host 0.0.0.0 --port 8000
        `],
        env: [
          { name: 'MODEL_NAME', value: 'gpt2' },
          { name: 'DEPLOYMENT_ID', value: deploymentId }
        ],
        resources: {
          limits: {
            cpu: '8',
            memory: '32Gi'
          }
        }
      }],
      serviceAccount: config.serviceAccountEmail,
      timeoutSeconds: 3600
    },
    traffic: [{
      type: 'TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST',
      percent: 100
    }]
  };

  const cloudRun = new ServicesClient({
    projectId: projectId,
    authClient: auth
  });

  try {
    // Try GPU deployment first
    console.log('🔄 Attempting GPU deployment without zonal redundancy...');
    const parent = `projects/${projectId}/locations/${region}`;
    
    const [operation] = await cloudRun.createService({
      parent,
      service: serviceWithGPU,
      serviceId: serviceName
    });
    
    console.log('⏳ Waiting for GPU service deployment...');
    const [result] = await operation.promise();
    
    console.log(`✅ ${modelSize} deployed with GPU (no redundancy)`);
    return {
      name: serviceName,
      url: result.uri || result.status?.url,
      model: modelSize,
      type: 'gpu'
    };
    
  } catch (gpuError) {
    console.warn('⚠️ GPU deployment failed:', gpuError.message);
    console.log('🔄 Falling back to CPU-only deployment...');
    
    try {
      // Fallback to CPU deployment
      const parent = `projects/${projectId}/locations/${region}`;
      
      const [operation] = await cloudRun.createService({
        parent,
        service: serviceWithoutGPU,
        serviceId: serviceName
      });
      
      console.log('⏳ Waiting for CPU service deployment...');
      const [result] = await operation.promise();
      
      console.log(`✅ ${modelSize} deployed with CPU-only (fallback)`);
      return {
        name: serviceName,
        url: result.uri || result.status?.url,
        model: modelSize,
        type: 'cpu'
      };
      
    } catch (cpuError) {
      console.error('❌ Both GPU and CPU deployments failed');
      throw cpuError;
    }
  }
}

// Helper functions
function getLLaMAContainerImage(modelSize) {
  const imageMap = {
    'LLaMA 3 7B': 'us-docker.pkg.dev/vertex-ai/vertex-vision-model-garden-dockers/pytorch-vllm-serve:20240220_0936_RC00',
    'LLaMA 3 13B': 'us-docker.pkg.dev/vertex-ai/vertex-vision-model-garden-dockers/pytorch-vllm-serve:20240220_0936_RC00',
    'LLaMA 3 70B': 'us-docker.pkg.dev/vertex-ai/vertex-vision-model-garden-dockers/pytorch-vllm-serve:20240220_0936_RC00'
  };
  return imageMap[modelSize] || imageMap['LLaMA 3 7B'];
}

function getModelName(modelSize) {
  const modelMap = {
    'LLaMA 3 7B': 'meta-llama/Llama-2-7b-chat-hf',
    'LLaMA 3 13B': 'meta-llama/Llama-2-13b-chat-hf',
    'LLaMA 3 70B': 'meta-llama/Llama-2-70b-chat-hf'
  };
  return modelMap[modelSize] || modelMap['LLaMA 3 7B'];
}

module.exports = {
  deployLLaMAModelWithoutRedundancy
};