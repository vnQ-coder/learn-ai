import os
import streamlit as st

st.set_page_config(page_title="AI Learning Curriculum", page_icon="\U0001F9E0", layout="wide")

MODULES = [
    ("01", "Embeddings: Normal (TF-IDF)", "Keyword search over support tickets — and where it fails."),
    ("02", "Embeddings: Semantic", "The same tickets, now matched by meaning, not just words."),
    ("03", "Short-Term Memory", "A chatbot that forgets what you said a few turns ago."),
    ("04", "Long-Term Memory", "An assistant that remembers facts across separate sessions."),
    ("05", "Production RAG", "Hybrid search plus a cited, grounded answer from real docs."),
    ("06", "RAG Guardrails", "Catching hallucination and refusing to answer when unsure."),
    ("07", "Tool Use (MCP-style)", "An agent that calls a real tool instead of guessing."),
    ("08", "Agent Negotiation", "Two agents haggling over a budget via HTTP messages."),
    ("09", "Shared Knowledge", "Three agents collaborating through a shared blackboard."),
]

if "gemini_api_key" not in st.session_state:
    st.session_state.gemini_api_key = os.environ.get("GEMINI_API_KEY", "")

with st.sidebar:
    st.subheader("Gemini API Key")
    key_input = st.text_input(
        "Paste a Gemini API key for this session",
        value=st.session_state.gemini_api_key,
        type="password",
        help="Used only in memory for this session; never written to disk.",
    )
    if key_input:
        st.session_state.gemini_api_key = key_input
        os.environ["GEMINI_API_KEY"] = key_input
    if os.environ.get("GEMINI_API_KEY"):
        st.success("Key set — modules 03/05/06/07/09 are live.")
    else:
        st.warning("No key set — modules 03/05/06/07/09 are disabled until you add one.")

st.title("AI Learning Curriculum")
st.write(
    "Nine runnable lessons on production RAG, embeddings, agent memory, "
    "and multi-agent systems. Pick a lesson from the sidebar to try it live."
)

for num, title, blurb in MODULES:
    st.markdown(f"**{num} — {title}**  \n{blurb}")
