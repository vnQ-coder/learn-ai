import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import streamlit as st
from module_loader import load_module, REPO_ROOT

st.set_page_config(page_title="04 - Long Term Memory", page_icon="\U0001F9E0")
st.title("04 — Long-Term Memory (Persistent, Cross-Session)")
st.write("**Scenario:** a personal assistant that remembers facts across separate sessions.")

mod = load_module("04-memory-long-term")
mod.DB_PATH = str(REPO_ROOT / "04-memory-long-term" / "chroma_data")

fact = st.text_input("Teach me a fact", value="I'm vegetarian")
if st.button("Remember"):
    mod.remember(fact)
    st.success(f"Remembered: {fact}")

question = st.text_input("Ask a question", value="what should I eat")
if st.button("Recall"):
    result = mod.recall(question)
    if result:
        st.info(f"Recalled: {result}")
    else:
        st.warning("Nothing remembered yet.")
