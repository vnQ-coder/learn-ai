# Curriculum Architecture

Every module folder contains exactly two files: `main.py`, a
standalone runnable script with no imports from other modules, and
`README.md`, documenting the scenario and expected output. All modules
share one root `requirements.txt` installed into a single virtual
environment.

Modules that call a large language model use the Gemini API via the
`google-genai` Python SDK, reading the API key from the
`GEMINI_API_KEY` environment variable. Modules 01, 02, 04, and 08 run
fully offline with no API key required — module 08 simulates two
agents negotiating using only local HTTP calls between processes on
the same machine.
