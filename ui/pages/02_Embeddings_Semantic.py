import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import streamlit as st
from sentence_transformers import SentenceTransformer
from module_loader import load_module

st.set_page_config(page_title="02 - Embeddings Semantic", page_icon="\U0001F9ED")
st.title("02 — Embeddings: Semantic")
st.write("**Scenario:** the same ticket search, now using meaning instead of literal words.")

mod = load_module("02-embeddings-semantic")


@st.cache_resource
def get_model():
    return SentenceTransformer("all-MiniLM-L6-v2")


query = st.text_input("Query", value=mod.QUERIES[0])
if st.button("Compare TF-IDF vs Semantic"):
    model = get_model()
    tfidf_text, tfidf_score = mod.tfidf_top1(mod.TICKETS, [query])[query]
    sem_text, sem_score = mod.semantic_top1(mod.TICKETS, [query], model)[query]
    col1, col2 = st.columns(2)
    with col1:
        st.metric("TF-IDF score", f"{tfidf_score:.3f}")
        st.caption(tfidf_text)
    with col2:
        st.metric("Semantic score", f"{sem_score:.3f}")
        st.caption(sem_text)
    if sem_score > tfidf_score + 0.15:
        st.success("Semantic search found a better match TF-IDF missed.")
