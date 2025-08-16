import streamlit as st
import requests
import json
import os
import time
from datetime import datetime
from typing import List, Dict, Any
import base64
from io import BytesIO

# Configure Streamlit page
st.set_page_config(
    page_title="AI Assistant",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Configuration from environment variables
API_ENDPOINT = os.getenv("API_ENDPOINT", "http://localhost:8000")
API_KEY = os.getenv("API_KEY", "")
DEPLOYMENT_ID = os.getenv("DEPLOYMENT_ID", "")
DEPLOYMENT_NAME = os.getenv("DEPLOYMENT_NAME", "AI Assistant")
INDUSTRY_TEMPLATE = os.getenv("INDUSTRY_TEMPLATE", "general")

# Industry-specific configurations
INDUSTRY_CONFIGS = {
    "legal": {
        "title": "Legal AI Assistant",
        "icon": "⚖️",
        "placeholder": "Ask me about contracts, legal documents, or case research...",
        "sample_questions": [
            "Analyze this contract for potential risks",
            "What are the key terms in this agreement?",
            "Find relevant case law for this matter",
            "Draft a clause for intellectual property protection"
        ],
        "document_types": ["Contract", "Legal Brief", "Case File", "Regulation", "Policy"]
    },
    "healthcare": {
        "title": "Healthcare AI Assistant",
        "icon": "🏥",
        "placeholder": "Ask me about medical documents, patient data, or clinical research...",
        "sample_questions": [
            "Summarize this patient's medical history",
            "What are the key findings in this report?",
            "Identify drug interactions in this prescription",
            "Analyze this clinical trial data"
        ],
        "document_types": ["Medical Record", "Lab Report", "Prescription", "Clinical Notes", "Research Paper"]
    },
    "finance": {
        "title": "Financial AI Assistant",
        "icon": "📊",
        "placeholder": "Ask me about financial documents, reports, or market analysis...",
        "sample_questions": [
            "Analyze this financial statement",
            "What are the risk factors in this investment?",
            "Summarize quarterly earnings trends",
            "Identify compliance issues in this report"
        ],
        "document_types": ["Financial Statement", "Earnings Report", "Investment Analysis", "Audit Report", "Compliance Document"]
    },
    "general": {
        "title": "AI Document Assistant",
        "icon": "🤖",
        "placeholder": "Ask me anything about your documents...",
        "sample_questions": [
            "Summarize this document",
            "What are the key points?",
            "Find information about specific topics",
            "Compare multiple documents"
        ],
        "document_types": ["Document", "Report", "Presentation", "Spreadsheet", "Text File"]
    }
}

# Get industry configuration
config = INDUSTRY_CONFIGS.get(INDUSTRY_TEMPLATE, INDUSTRY_CONFIGS["general"])

# Initialize session state
if "messages" not in st.session_state:
    st.session_state.messages = []
if "uploaded_documents" not in st.session_state:
    st.session_state.uploaded_documents = []

def make_api_request(endpoint: str, method: str = "GET", data: Any = None, files: Any = None) -> Dict:
    """Make API request to the AI backend"""
    url = f"{API_ENDPOINT}{endpoint}"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
    }
    
    if files:
        response = requests.request(method, url, headers=headers, data=data, files=files)
    else:
        headers["Content-Type"] = "application/json"
        response = requests.request(method, url, headers=headers, json=data)
    
    if response.status_code == 200:
        return response.json()
    else:
        st.error(f"API Error: {response.status_code} - {response.text}")
        return {}

def upload_document(file) -> str:
    """Upload document to the AI system"""
    try:
        files = {"file": (file.name, file.getvalue(), file.type)}
        data = {"deployment_id": DEPLOYMENT_ID}
        
        result = make_api_request("/documents/upload", "POST", data=data, files=files)
        
        if result:
            st.success(f"✅ Document '{file.name}' uploaded successfully!")
            return result.get("document_id", "")
        else:
            st.error(f"❌ Failed to upload '{file.name}'")
            return ""
    except Exception as e:
        st.error(f"❌ Error uploading document: {str(e)}")
        return ""

def query_ai(question: str, document_ids: List[str] = None) -> Dict:
    """Query the AI assistant"""
    try:
        data = {
            "query": question,
            "deployment_id": DEPLOYMENT_ID,
            "document_ids": document_ids or [],
            "max_tokens": 1000,
            "temperature": 0.7
        }
        
        return make_api_request("/ai/query", "POST", data=data)
    except Exception as e:
        st.error(f"❌ Error querying AI: {str(e)}")
        return {}

def format_response(response: str) -> str:
    """Format AI response with proper markdown"""
    # Add basic formatting improvements
    formatted = response.replace("**", "**")  # Ensure bold formatting
    formatted = formatted.replace("\n-", "\n•")  # Convert dashes to bullets
    return formatted

# Sidebar
with st.sidebar:
    st.title(f"{config['icon']} {config['title']}")
    st.markdown(f"**Deployment:** {DEPLOYMENT_NAME}")
    st.markdown(f"**ID:** `{DEPLOYMENT_ID[:8]}...`")
    
    st.divider()
    
    # Document Upload Section
    st.subheader("📄 Upload Documents")
    uploaded_files = st.file_uploader(
        "Choose files to upload",
        accept_multiple_files=True,
        type=['pdf', 'txt', 'doc', 'docx', 'csv', 'xlsx'],
        help="Upload documents for the AI to analyze"
    )
    
    if uploaded_files:
        for file in uploaded_files:
            if file not in st.session_state.uploaded_documents:
                with st.spinner(f"Uploading {file.name}..."):
                    document_id = upload_document(file)
                    if document_id:
                        st.session_state.uploaded_documents.append({
                            "name": file.name,
                            "id": document_id,
                            "type": file.type,
                            "size": file.size,
                            "uploaded_at": datetime.now()
                        })
    
    # Uploaded Documents List
    if st.session_state.uploaded_documents:
        st.subheader("📚 Your Documents")
        for doc in st.session_state.uploaded_documents:
            with st.expander(f"📄 {doc['name']}"):
                st.write(f"**Type:** {doc['type']}")
                st.write(f"**Size:** {doc['size']:,} bytes")
                st.write(f"**Uploaded:** {doc['uploaded_at'].strftime('%Y-%m-%d %H:%M')}")
                if st.button(f"Remove {doc['name']}", key=f"remove_{doc['id']}"):
                    st.session_state.uploaded_documents.remove(doc)
                    st.rerun()
    
    st.divider()
    
    # Sample Questions
    st.subheader("💡 Sample Questions")
    for question in config["sample_questions"]:
        if st.button(question, key=f"sample_{hash(question)}"):
            st.session_state.messages.append({
                "role": "user",
                "content": question,
                "timestamp": datetime.now()
            })
            st.rerun()
    
    st.divider()
    
    # Clear Chat
    if st.button("🗑️ Clear Chat", type="secondary"):
        st.session_state.messages = []
        st.rerun()

# Main Chat Interface
st.title(f"{config['icon']} {config['title']}")
st.markdown("Ask questions about your documents or get AI assistance for your work.")

# Chat Messages Container
chat_container = st.container()

with chat_container:
    # Display chat messages
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            if message["role"] == "user":
                st.write(message["content"])
                if "timestamp" in message:
                    st.caption(f"Asked at {message['timestamp'].strftime('%H:%M:%S')}")
            else:
                st.markdown(message["content"])
                if "sources" in message:
                    with st.expander("📚 Sources"):
                        for source in message["sources"]:
                            st.write(f"• {source}")
                if "timestamp" in message:
                    st.caption(f"Responded at {message['timestamp'].strftime('%H:%M:%S')}")

# Chat Input
if prompt := st.chat_input(config["placeholder"]):
    # Add user message
    st.session_state.messages.append({
        "role": "user",
        "content": prompt,
        "timestamp": datetime.now()
    })
    
    # Display user message immediately
    with st.chat_message("user"):
        st.write(prompt)
        st.caption(f"Asked at {datetime.now().strftime('%H:%M:%S')}")
    
    # Get AI response
    with st.chat_message("assistant"):
        with st.spinner("🤔 Thinking..."):
            document_ids = [doc["id"] for doc in st.session_state.uploaded_documents]
            response = query_ai(prompt, document_ids)
            
            if response:
                ai_response = response.get("response", "Sorry, I couldn't generate a response.")
                sources = response.get("sources", [])
                
                # Format and display response
                formatted_response = format_response(ai_response)
                st.markdown(formatted_response)
                
                # Display sources if available
                if sources:
                    with st.expander("📚 Sources"):
                        for source in sources:
                            st.write(f"• {source}")
                
                st.caption(f"Responded at {datetime.now().strftime('%H:%M:%S')}")
                
                # Add assistant message to session state
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": formatted_response,
                    "sources": sources,
                    "timestamp": datetime.now()
                })
            else:
                error_message = "Sorry, I'm having trouble connecting to the AI service. Please try again."
                st.error(error_message)
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": error_message,
                    "timestamp": datetime.now()
                })

# Footer
st.divider()
col1, col2, col3 = st.columns(3)

with col1:
    st.metric("📄 Documents", len(st.session_state.uploaded_documents))

with col2:
    st.metric("💬 Messages", len(st.session_state.messages))

with col3:
    if st.session_state.messages:
        last_message_time = st.session_state.messages[-1]["timestamp"]
        st.metric("🕒 Last Activity", last_message_time.strftime("%H:%M:%S"))
    else:
        st.metric("🕒 Last Activity", "None")

# Advanced Features Section
with st.expander("⚙️ Advanced Features"):
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("🎛️ AI Settings")
        temperature = st.slider("Creativity Level", 0.0, 1.0, 0.7, 0.1, 
                               help="Lower values = more focused, Higher values = more creative")
        max_tokens = st.slider("Response Length", 100, 2000, 1000, 100,
                              help="Maximum length of AI responses")
    
    with col2:
        st.subheader("📊 Usage Stats")
        # This would typically pull real usage data
        st.write("Today's Usage:")
        st.write("• Queries: 23")
        st.write("• Documents Processed: 8")
        st.write("• API Calls: 156")

# Export Chat Option
if st.session_state.messages:
    with st.expander("💾 Export Chat"):
        if st.button("Download Chat History"):
            chat_export = {
                "deployment_id": DEPLOYMENT_ID,
                "deployment_name": DEPLOYMENT_NAME,
                "industry": INDUSTRY_TEMPLATE,
                "exported_at": datetime.now().isoformat(),
                "messages": [
                    {
                        "role": msg["role"],
                        "content": msg["content"],
                        "timestamp": msg["timestamp"].isoformat() if "timestamp" in msg else None,
                        "sources": msg.get("sources", [])
                    }
                    for msg in st.session_state.messages
                ]
            }
            
            json_str = json.dumps(chat_export, indent=2)
            st.download_button(
                label="📥 Download JSON",
                data=json_str,
                file_name=f"chat_history_{DEPLOYMENT_ID[:8]}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                mime="application/json"
            )

# Custom CSS for better styling
st.markdown("""
<style>
    .stChatMessage {
        background-color: #f0f2f6;
        border-radius: 10px;
        padding: 10px;
        margin: 5px 0;
    }
    
    .stChatMessage[data-testid="user"] {
        background-color: #e3f2fd;
    }
    
    .stChatMessage[data-testid="assistant"] {
        background-color: #f3e5f5;
    }
    
    .metric-container {
        background-color: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 5px;
        padding: 10px;
        text-align: center;
    }
    
    .stExpander {
        border: 1px solid #e0e0e0;
        border-radius: 5px;
    }
</style>
""", unsafe_allow_html=True)

# JavaScript for auto-scroll (optional)
st.markdown("""
<script>
    function scrollToBottom() {
        window.scrollTo(0, document.body.scrollHeight);
    }
    
    // Auto-scroll when new messages are added
    setTimeout(scrollToBottom, 100);
</script>
""", unsafe_allow_html=True)