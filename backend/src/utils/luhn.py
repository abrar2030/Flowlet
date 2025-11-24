def is_valid_luhn(card_number: str) -> bool:
    """Validates a card number using the Luhn algorithm."""
    try:
        digits = [int(d) for d in card_number]
    except ValueError:
        return False

    checksum = digits.pop()
    digits.reverse()

    doubled_digits = []
    for i, digit in enumerate(digits):
        if i % 2 == 0:
            doubled_digit = digit * 2
            if doubled_digit > 9:
                doubled_digit -= 9
            doubled_digits.append(doubled_digit)
        else:
            doubled_digits.append(digit)

    total = sum(doubled_digits)
    return (total + checksum) % 10 == 0
