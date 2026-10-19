import time
import json
from pathlib import Path
from typing import Dict, Any, List
from app.config import PROJECT_ROOT

AUDIT_LOG_FILE = PROJECT_ROOT / "experiments" / "audit_log.jsonl"

class AuditLogger:
    @classmethod
    def log_event(cls, event_type: str, details: Dict[str, Any], user: str = "researcher"):
        record = {
            "timestamp": time.time(),
            "datetime": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            "event_type": event_type,
            "user": user,
            "details": details
        }
        try:
            with open(AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(record) + "\n")
        except Exception:
            pass

    @classmethod
    def get_recent_events(cls, limit: int = 50) -> List[Dict[str, Any]]:
        if not AUDIT_LOG_FILE.exists():
            return []
        events = []
        try:
            with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
                lines = f.readlines()
                for line in reversed(lines[-limit:]):
                    if line.strip():
                        events.append(json.loads(line))
        except Exception:
            pass
        return events
