"""Logging utilities for DraftMate AI with structured, standardized formatting."""

import logging
import os
import sys
from typing import Optional


_CONFIGURED = False
DEFAULT_LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def setup_logging(
    level: str = "INFO",
    log_file: Optional[str] = None,
    log_format: str = DEFAULT_LOG_FORMAT,
) -> None:
    """Configure root logger for DraftMate AI."""
    global _CONFIGURED

    numeric_level = getattr(logging, level.upper(), logging.INFO)
    handlers: list[logging.Handler] = [logging.StreamHandler(sys.stdout)]

    if log_file:
        os.makedirs(os.path.dirname(os.path.abspath(log_file)), exist_ok=True)
        handlers.append(logging.FileHandler(log_file, encoding="utf-8"))

    logging.basicConfig(
        level=numeric_level,
        format=log_format,
        datefmt=DATE_FORMAT,
        handlers=handlers,
        force=True,
    )
    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    """Obtain a standardized logger for a module."""
    global _CONFIGURED
    if not _CONFIGURED:
        log_level = os.environ.get("LOG_LEVEL", "INFO")
        log_file = os.environ.get("LOG_FILE", None)
        setup_logging(level=log_level, log_file=log_file)
    return logging.getLogger(name)

