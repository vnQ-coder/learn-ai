import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import streamlit as st
from sentence_transformers import SentenceTransformer
from module_loader import load_module

st.set_page_config(page_title="05 - Production RAG", page_icon="\U0001F4DA")
st.title("05 — Production RAG (Hybrid Search + Citations)")
st.write("**Scenario:** a documentation Q&A bot over real markdown files.")

if not os.environ.get("GEMINI_API_KEY"):
    st.warning("Set a Gemini API key in the sidebar to run this module.")
else:
    mod = load_module("05-rag-production")

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

    question = st.text_input("Question", value="What does this curriculum teach?")
    if st.button("Run RAG pipeline"):
        try:
            from google import genai
            chunks, embeddings, bm25, model = get_index()
            retrieved = mod.hybrid_search(question, chunks, embeddings, bm25, model)
            st.subheader("Retrieved chunks")
            for r in retrieved:
                st.write(f"raw_vector_score={r['raw_vector_score']:.3f} — {r['source']}")
            client = genai.Client()
            answer = mod.answer_question(client, question, retrieved)
            st.subheader("Answer")
            st.write(answer)
        except Exception as e:
            st.error(f"Gemini call failed: {e}")
