"""
Database mixins for common model fields
"""
from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import TypeDecorator, CHAR
import uuid

# Define a custom UUID type for SQLAlchemy
class UUID(TypeDecorator):
    """Platform-independent UUID type.
    
    Uses Postgresql's UUID type, otherwise uses
    CHAR(32), storing as stringified hex values.
    """
    impl = CHAR
    cache_ok = False

    def __init__(self, as_uuid=False, *args, **kwargs):
        self.as_uuid = as_uuid
        super().__init__(*args, **kwargs)

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID())
        else:
            return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return str(uuid.UUID(value))
            return "%.32x" % value.int

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if self.as_uuid and not isinstance(value, uuid.UUID):
                value = uuid.UUID(value)
            return value

class TimestampMixin(object):
    """Mixin for created_at and updated_at fields"""
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

class UUIDMixin(object):
    """Mixin for id field as UUID"""
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
