"""Luhn algorithm for card validation"""

from typing import Any


def validate_luhn(card_number: str) -> bool:
    """Validate card number using Luhn algorithm"""

    def digits_of(n: str) -> Any:
        return [int(d) for d in str(n)]

    digits = digits_of(card_number.replace(" ", "").replace("-", ""))
    odd_digits = digits[-1::-2]
    even_digits = digits[-2::-2]
    checksum = sum(odd_digits)

    for d in even_digits:
        checksum += sum(digits_of(d * 2))

    return checksum % 10 == 0
