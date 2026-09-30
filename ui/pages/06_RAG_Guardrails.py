import os
import sys
from pathlib import Path
_ui_dir = str(Path(__file__).resolve().parent.parent)
if _ui_dir not in sys.path:
    sys.path.insert(0, _ui_dir)

import streamlit as st
from sentence_transformers import SentenceTransformer
from module_loader import load_module

st.set_page_config(page_title="06 - RAG Guardrails", page_icon="\U0001F6E1")
st.title("06 — RAG Evaluation & Guardrails")
st.write("**Scenario:** grading the RAG bot's own answers before trusting them.")

if not os.environ.get("GEMINI_API_KEY"):
    st.warning("Set a Gemini API key on the home page (app) sidebar to run this module.")
else:
    mod = load_module("06-rag-evaluation-guardrails")

    @st.cache_resource
    def get_model():
        return SentenceTransformer("all-MiniLM-L6-v2")

    @st.cache_resource
    def get_index():
        folder = str(Path(__file__).resolve().parent.parent / "example_docs")
        docs = mod.load_markdown_files(folder)
        chunks = [c for path, text in docs for c in mod.chunk_text(path, text)]
        model = get_model()
        embeddings, bm25 = mod.build_index(chunks, model)
        return chunks, embeddings, bm25, model

    def run_question(question):
        from google import genai
        chunks, embeddings, bm25, model = get_index()
        retrieved = mod.hybrid_search(question, chunks, embeddings, bm25, model)
        if retrieved:
            st.write(f"top raw_vector_score={retrieved[0]['raw_vector_score']:.3f}")
        else:
            st.write("no chunks retrieved")
        client = genai.Client()
        result = mod.answer_with_guardrails(client, question, retrieved)
        st.write(result)

    question = st.text_input("Question", value="What does this curriculum teach?")
    col1, col2 = st.columns(2)
    with col1:
        if st.button("Ask on-topic question"):
            try:
                run_question(question)
            except Exception as e:
                st.error(f"Gemini call failed: {e}")
    with col2:
        if st.button("Ask something unrelated (should refuse)"):
            try:
                run_question("what is the best pizza topping for a party?")
            except Exception as e:
                st.error(f"Gemini call failed: {e}")
