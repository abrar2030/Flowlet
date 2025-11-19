"""
Payment Processor Factory
Provides a way to get the correct payment processor implementation based on type.
"""
from .stripe_integration import PaymentProcessor, StripePaymentProcessor

class PaymentProcessorFactory:
    """Factory class to retrieve payment processor instances."""
    
    @staticmethod
    def get_processor(processor_type: str) -> PaymentProcessor:
        """
        Returns a payment processor instance.
        
        :param processor_type: The type of processor to retrieve (e.g., 'stripe', 'ach').
        :raises ValueError: If the processor type is not supported.
        :return: An instance of a PaymentProcessor.
        """
        processor_type = processor_type.lower()
        
        if processor_type == 'stripe':
            # Assuming stripe_processor is exported from stripe_integration.py
            from .stripe_integration import stripe_processor
            return stripe_processor
        # elif processor_type == 'ach':
        #     from .ach_integration import ach_processor
        #     return ach_processor
        else:
            raise ValueError(f"Unsupported payment processor type: {processor_type}")

# Export the factory instance
payment_factory = PaymentProcessorFactory()
