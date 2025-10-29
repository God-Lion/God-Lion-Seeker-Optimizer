"""Base repository with generic CRUD operations"""
from typing import TypeVar, Generic, Type, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from src.models import Base
import logging

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=Base)


class BaseRepository(Generic[T]):
    """
    Base repository class providing common CRUD operations for all models.
    Async-only implementation.
    """
    
    def __init__(self, session: AsyncSession, model: Type[T]):
        self.session = session
        self.model = model
    
    async def create(self, instance: T) -> T:
        """
        Create and persist a new instance.
        
        Args:
            instance: Model instance to create
            
        Returns:
            The created instance
        """
        try:
            self.session.add(instance)
            await self.session.flush()
            logger.debug(f"Created {self.model.__name__}: {instance.id}")
            return instance
        except Exception as e:
            logger.error(f"Error creating {self.model.__name__}: {e}")
            raise
    
    async def get_by_id(self, id: int) -> Optional[T]:
        """
        Retrieve instance by primary key.
        
        Args:
            id: Primary key value
            
        Returns:
            Instance or None if not found
        """
        try:
            instance = await self.session.get(self.model, id)
            return instance
        except Exception as e:
            logger.error(f"Error fetching {self.model.__name__} by id {id}: {e}")
            raise
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """
        Retrieve all instances with pagination.
        
        Args:
            skip: Number of records to skip
            limit: Maximum records to return
            
        Returns:
            List of instances
        """
        try:
            query = select(self.model).offset(skip).limit(limit)
            result = await self.session.execute(query)
            instances = result.scalars().all()
            return list(instances)
        except Exception as e:
            logger.error(f"Error fetching all {self.model.__name__}: {e}")
            raise
    
    async def update_by_id(self, id: int, **kwargs) -> Optional[T]:
        """
        Update instance and return updated object.
        
        Args:
            id: Primary key value
            **kwargs: Fields to update
            
        Returns:
            Updated instance or None if not found
        """
        try:
            await self.session.execute(
                update(self.model).where(self.model.id == id).values(**kwargs)
            )
            await self.session.flush()
            return await self.get_by_id(id)
        except Exception as e:
            logger.error(f"Error updating {self.model.__name__} id {id}: {e}")
            raise
    
    async def delete_by_id(self, id: int) -> bool:
        """
        Delete instance by primary key.
        
        Args:
            id: Primary key value
            
        Returns:
            True if deleted, False if not found
        """
        try:
            result = await self.session.execute(
                delete(self.model).where(self.model.id == id)
            )
            await self.session.flush()
            deleted = result.rowcount > 0
            if deleted:
                logger.debug(f"Deleted {self.model.__name__} id {id}")
            return deleted
        except Exception as e:
            logger.error(f"Error deleting {self.model.__name__} id {id}: {e}")
            raise
    
    async def exists(self, **filters) -> bool:
        """
        Check if record exists matching filters.
        
        Args:
            **filters: Field=value pairs to filter by
            
        Returns:
            True if exists, False otherwise
        """
        try:
            query = select(self.model).filter_by(**filters).limit(1)
            result = await self.session.execute(query)
            exists = result.scalar() is not None
            return exists
        except Exception as e:
            logger.error(f"Error checking existence of {self.model.__name__}: {e}")
            raise
    
    async def count(self) -> int:
        """
        Count total records.
        
        Returns:
            Total count
        """
        try:
            from sqlalchemy import func
            query = select(func.count()).select_from(self.model)
            result = await self.session.execute(query)
            count = result.scalar()
            return count or 0
        except Exception as e:
            logger.error(f"Error counting {self.model.__name__}: {e}")
            raise
    
    async def delete_all(self) -> int:
        """
        Delete all records (use with caution!).
        
        Returns:
            Number of deleted records
        """
        try:
            result = await self.session.execute(delete(self.model))
            await self.session.flush()
            count = result.rowcount
            logger.warning(f"Deleted {count} {self.model.__name__} records")
            return count
        except Exception as e:
            logger.error(f"Error deleting all {self.model.__name__}: {e}")
            raise
