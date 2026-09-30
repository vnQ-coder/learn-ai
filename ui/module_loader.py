"""Loads a numbered curriculum module's main.py as a standalone module
object, without requiring it to be a valid Python package name."""
import importlib.util
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def load_module(folder_name: str):
    main_path = REPO_ROOT / folder_name / "main.py"
    spec = importlib.util.spec_from_file_location(folder_name.replace("-", "_"), main_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module
