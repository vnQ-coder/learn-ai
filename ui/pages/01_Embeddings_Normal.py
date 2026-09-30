import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import streamlit as st
from module_loader import load_module

st.set_page_config(page_title="01 - Embeddings Normal", page_icon="\U0001F524")
st.title("01 — Embeddings: Normal (TF-IDF)")
st.write("**Scenario:** a support-ticket search box that only matches literal keywords.")

mod = load_module("01-embeddings-normal")

query = st.text_input("Query", value=mod.QUERIES[0])
if st.button("Run TF-IDF search"):
    results = mod.search(mod.TICKETS, [query])[query]
    for text, score in results:
        marker = "✅ MATCH" if score > 0.05 else "❌ MISS (score ~0)"
        st.write(f"**{marker}** — score={score:.3f}")
        st.caption(text)
