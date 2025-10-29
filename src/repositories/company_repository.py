"""Company repository with specialized queries"""
from typing import List, Optional, Union, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import select, desc, func
from src.models import Company, Job
from .base import BaseRepository
import logging

logger = logging.getLogger(__name__)


class CompanyRepository(BaseRepository[Company]):
    """Repository for Company model with custom queries"""
    
    def __init__(self, session: AsyncSession):
        super().__init__(session, Company)
    
    async def get_by_name(self, name: str) -> Optional[Company]:
        """
        Retrieve company by exact name match.
        
        Args:
            name: Company name
            
        Returns:
            Company instance or None
        """
        try:
            query = select(Company).where(Company.name == name)
            result = await self.session.execute(query)
            return result.scalar()
        except Exception as e:
            logger.error(f"Error fetching company by name '{name}': {e}")
            raise
    
    async def search_by_name(self, keyword: str, limit: int = 20) -> List[Company]:
        """
        Search companies by name keyword.
        
        Args:
            keyword: Search keyword
            limit: Maximum results
            
        Returns:
            List of matching companies
        """
        try:
            search_term = f"%{keyword}%"
            query = (
                select(Company)
                .where(Company.name.ilike(search_term))
                .order_by(Company.name)
                .limit(limit)
            )
            result = await self.session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error searching companies with name '{keyword}': {e}")
            raise
    
    async def get_by_industry(
        self,
        industry: str,
        limit: int = 50
    ) -> List[Company]:
        """
        Retrieve all companies in a specific industry.
        
        Args:
            industry: Industry name
            limit: Maximum results
            
        Returns:
            List of companies in the industry
        """
        try:
            query = (
                select(Company)
                .where(Company.industry == industry)
                .order_by(Company.name)
                .limit(limit)
            )
            result = await self.session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching companies in industry '{industry}': {e}")
            raise
    
    async def get_by_location(
        self,
        location: str,
        limit: int = 50
    ) -> List[Company]:
        """
        Retrieve companies by location.
        
        Args:
            location: Location keyword
            limit: Maximum results
            
        Returns:
            List of companies in the location
        """
        try:
            search_term = f"%{location}%"
            query = (
                select(Company)
                .where(Company.location.ilike(search_term))
                .order_by(Company.name)
                .limit(limit)
            )
            result = await self.session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching companies in location '{location}': {e}")
            raise
    
    async def get_by_size(
        self,
        size: str,
        limit: int = 50
    ) -> List[Company]:
        """
        Retrieve companies by size range.
        
        Args:
            size: Size range (e.g., '51-200', '1001-5000')
            limit: Maximum results
            
        Returns:
            List of companies in the size range
        """
        try:
            query = (
                select(Company)
                .where(Company.company_size == size)
                .order_by(Company.name)
                .limit(limit)
            )
            result = await self.session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching companies with size '{size}': {e}")
            raise
    
    async def get_or_create(self, name: str, **kwargs) -> Company:
        """
        Get existing company or create new one if doesn't exist.
        
        Args:
            name: Company name
            **kwargs: Additional fields for creation
            
        Returns:
            Company instance (new or existing)
        """
        try:
            existing = await self.get_by_name(name)
            if existing:
                logger.debug(f"Found existing company: {name}")
                return existing
            
            new_company = await self.create(name=name, **kwargs)
            logger.info(f"Created new company: {name}")
            return new_company
        except Exception as e:
            logger.error(f"Error in get_or_create for company '{name}': {e}")
            raise
    
    async def list_industries(self) -> List[str]:
        """
        Get list of all unique industries.
        
        Returns:
            List of industry names
        """
        try:
            query = (
                select(Company.industry)
                .where(Company.industry.isnot(None))
                .distinct()
                .order_by(Company.industry)
            )
            result = await self.session.execute(query)
            industries = result.scalars().all()
            return list(industries)
        except Exception as e:
            logger.error("Error fetching list of industries: {e}")
            raise
    
    async def list_sizes(self) -> List[str]:
        """
        Get list of all unique company sizes.
        
        Returns:
            List of company sizes
        """
        try:
            query = (
                select(Company.company_size)
                .where(Company.company_size.isnot(None))
                .distinct()
                .order_by(Company.company_size)
            )
            result = await self.session.execute(query)
            sizes = result.scalars().all()
            return list(sizes)
        except Exception as e:
            logger.error(f"Error fetching list of company sizes: {e}")
            raise
    

