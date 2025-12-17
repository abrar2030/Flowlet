"""
Sanctions Screening Service
Screens individuals and entities against sanctions lists
"""

import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)


class SanctionsListType(Enum):
    """Types of sanctions lists"""

    OFAC = "ofac"  # US Office of Foreign Assets Control
    EU = "eu"  # European Union
    UN = "un"  # United Nations
    UK = "uk"  # UK HM Treasury


class ScreeningResult(Enum):
    """Screening results"""

    CLEAR = "clear"
    MATCH = "match"
    POTENTIAL_MATCH = "potential_match"
    ERROR = "error"


@dataclass
class ScreeningRecord:
    """Sanctions screening record"""

    screening_id: str
    name: str
    result: str
    matches: List[Dict[str, Any]]
    lists_checked: List[str]
    timestamp: str
    confidence_score: float = 0.0


class SanctionsScreeningService:
    """
    Service for screening against sanctions lists
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize sanctions screening service"""
        self.config = config or {}
        self.enabled = self.config.get("SANCTIONS_SCREENING_ENABLED", True)
        self.mock_mode = self.config.get("SANCTIONS_MOCK_MODE", True)
        self.screening_history: List[ScreeningRecord] = []
        self.screening_id_counter = 0

        # In production, this would connect to actual sanctions databases
        # For now, we'll use a simple mock list
        self.mock_sanctions_list = [
            "John Doe",  # Fake entries for testing
            "Jane Smith",
            "ACME Corporation",
        ]

        logger.info(
            f"Sanctions Screening Service initialized (mock_mode={self.mock_mode})"
        )

    def screen_individual(
        self,
        first_name: str,
        last_name: str,
        date_of_birth: Optional[str] = None,
        nationality: Optional[str] = None,
        lists: Optional[List[SanctionsListType]] = None,
    ) -> Dict[str, Any]:
        """
        Screen an individual against sanctions lists

        Args:
            first_name: First name
            last_name: Last name
            date_of_birth: Date of birth (YYYY-MM-DD)
            nationality: Nationality code
            lists: Specific lists to check (checks all if None)

        Returns:
            Dict containing screening results
        """
        if not self.enabled:
            return {
                "result": ScreeningResult.CLEAR.value,
                "message": "Screening disabled",
            }

        self.screening_id_counter += 1
        screening_id = f"SCR-{datetime.utcnow().strftime('%Y%m%d')}-{self.screening_id_counter:06d}"

        full_name = f"{first_name} {last_name}"
        lists_to_check = lists or [SanctionsListType.OFAC, SanctionsListType.EU]

        if self.mock_mode:
            # Mock screening logic
            matches = []
            result = ScreeningResult.CLEAR

            # Simple name matching for mock
            for sanctioned_name in self.mock_sanctions_list:
                if (
                    sanctioned_name.lower() in full_name.lower()
                    or full_name.lower() in sanctioned_name.lower()
                ):
                    matches.append(
                        {
                            "name": sanctioned_name,
                            "list": "MOCK_LIST",
                            "confidence": 0.85,
                        }
                    )
                    result = ScreeningResult.MATCH

            record = ScreeningRecord(
                screening_id=screening_id,
                name=full_name,
                result=result.value,
                matches=matches,
                lists_checked=[lst.value for lst in lists_to_check],
                timestamp=datetime.utcnow().isoformat(),
                confidence_score=0.85 if matches else 1.0,
            )

            self.screening_history.append(record)

            return {
                "screening_id": screening_id,
                "result": result.value,
                "matches": matches,
                "lists_checked": [lst.value for lst in lists_to_check],
                "timestamp": record.timestamp,
            }
        else:
            # Real screening would connect to actual API services
            # Such as Dow Jones, World-Check, ComplyAdvantage, etc.
            raise NotImplementedError(
                "Real sanctions screening requires integration with screening provider"
            )

    def screen_entity(
        self,
        entity_name: str,
        jurisdiction: Optional[str] = None,
        entity_type: Optional[str] = None,
        lists: Optional[List[SanctionsListType]] = None,
    ) -> Dict[str, Any]:
        """
        Screen an entity/organization against sanctions lists

        Args:
            entity_name: Name of the entity
            jurisdiction: Jurisdiction/country
            entity_type: Type of entity (company, ngo, etc.)
            lists: Specific lists to check

        Returns:
            Dict containing screening results
        """
        if not self.enabled:
            return {
                "result": ScreeningResult.CLEAR.value,
                "message": "Screening disabled",
            }

        self.screening_id_counter += 1
        screening_id = f"SCR-{datetime.utcnow().strftime('%Y%m%d')}-{self.screening_id_counter:06d}"

        lists_to_check = lists or [SanctionsListType.OFAC, SanctionsListType.EU]

        if self.mock_mode:
            matches = []
            result = ScreeningResult.CLEAR

            for sanctioned_name in self.mock_sanctions_list:
                if (
                    sanctioned_name.lower() in entity_name.lower()
                    or entity_name.lower() in sanctioned_name.lower()
                ):
                    matches.append(
                        {
                            "name": sanctioned_name,
                            "list": "MOCK_LIST",
                            "confidence": 0.80,
                        }
                    )
                    result = ScreeningResult.MATCH

            record = ScreeningRecord(
                screening_id=screening_id,
                name=entity_name,
                result=result.value,
                matches=matches,
                lists_checked=[lst.value for lst in lists_to_check],
                timestamp=datetime.utcnow().isoformat(),
                confidence_score=0.80 if matches else 1.0,
            )

            self.screening_history.append(record)

            return {
                "screening_id": screening_id,
                "result": result.value,
                "matches": matches,
                "lists_checked": [lst.value for lst in lists_to_check],
                "timestamp": record.timestamp,
            }
        else:
            raise NotImplementedError(
                "Real sanctions screening requires integration with screening provider"
            )

    def get_screening_result(self, screening_id: str) -> Optional[Dict[str, Any]]:
        """Get screening result by ID"""
        for record in self.screening_history:
            if record.screening_id == screening_id:
                return asdict(record)
        return None

    def get_screening_history(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent screening history"""
        return [asdict(r) for r in self.screening_history[-limit:]]


# Global instance
_service: Optional[SanctionsScreeningService] = None


def get_sanctions_screening_service() -> SanctionsScreeningService:
    """Get the global sanctions screening service instance"""
    global _service
    if _service is None:
        _service = SanctionsScreeningService()
    return _service
