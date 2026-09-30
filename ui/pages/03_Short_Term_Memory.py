import io
import os
import sys
from contextlib import redirect_stdout
from pathlib import Path
_ui_dir = str(Path(__file__).resolve().parent.parent)
if _ui_dir not in sys.path:
    sys.path.insert(0, _ui_dir)

import streamlit as st
from module_loader import load_module

st.set_page_config(page_title="03 - Short Term Memory", page_icon="\U0001F4AC")
st.title("03 — Short-Term Memory (Sliding Window)")
st.write(
    "**Scenario:** a support chatbot booking a flight, where an early "
    "detail must survive to the last turn."
)

if not os.environ.get("GEMINI_API_KEY"):
    st.warning("Set a Gemini API key on the home page (app) sidebar to run this module.")
else:
    mod = load_module("03-memory-short-term")
    col1, col2 = st.columns(2)
    with col1:
        if st.button("Run with window_size=10 (remembers)"):
            buf = io.StringIO()
            try:
                with redirect_stdout(buf):
                    mod.run_conversation(window_size=10)
                st.code(buf.getvalue())
            except Exception as e:
                if buf.getvalue():
                    st.code(buf.getvalue())
                st.error(f"Gemini call failed: {e}")
    with col2:
        if st.button("Run with window_size=1 (forgets)"):
            buf = io.StringIO()
            try:
                with redirect_stdout(buf):
                    mod.run_conversation(window_size=1)
                st.code(buf.getvalue())
            except Exception as e:
                if buf.getvalue():
                    st.code(buf.getvalue())
                st.error(f"Gemini call failed: {e}")
