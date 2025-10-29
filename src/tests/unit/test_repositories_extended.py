"""Extended unit tests for repositories"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta


class TestUserRepository:
    """Test UserRepository"""
    
    @pytest.fixture
    def mock_session(self):
        """Create mock database session"""
        session = MagicMock()
        session.execute = AsyncMock()
        session.commit = AsyncMock()
        session.rollback = AsyncMock()
        return session
    
    @pytest.fixture
    def user_repo(self, mock_session):
        """Create UserRepository instance"""
        from repositories.user_repository import UserRepository
        return UserRepository(mock_session)
    
    @pytest.mark.asyncio
    async def test_create_user(self, user_repo, mock_session):
        """Test creating a new user"""
        user_data = {
            "email": "test@example.com",
            "name": "Test User",
            "password_hash": "hashed_password"
        }
        
        user = await user_repo.create(**user_data)
        
        assert user.email == "test@example.com"
        mock_session.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_user_by_email(self, user_repo, mock_session):
        """Test getting user by email"""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = MagicMock(
            email="test@example.com",
            name="Test User"
        )
        mock_session.execute.return_value = mock_result
        
        user = await user_repo.get_by_email("test@example.com")
        
        assert user is not None
        assert user.email == "test@example.com"
    
    @pytest.mark.asyncio
    async def test_update_user(self, user_repo, mock_session):
        """Test updating user"""
        user = MagicMock(email="test@example.com", name="Old Name")
        
        updated_user = await user_repo.update(user, name="New Name")
        
        assert updated_user.name == "New Name"
        mock_session.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_delete_user(self, user_repo, mock_session):
        """Test deleting user"""
        user = MagicMock(email="test@example.com")
        
        await user_repo.delete(user)
        
        mock_session.delete.assert_called_once_with(user)
        mock_session.commit.assert_called_once()


class TestJobAnalysisRepository:
    """Test JobAnalysisRepository"""
    
    @pytest.fixture
    def mock_session(self):
        """Create mock database session"""
        session = MagicMock()
        session.execute = AsyncMock()
        session.commit = AsyncMock()
        return session
    
    @pytest.fixture
    def analysis_repo(self, mock_session):
        """Create JobAnalysisRepository instance"""
        from repositories.job_analysis_repository import JobAnalysisRepository
        return JobAnalysisRepository(mock_session)
    
    @pytest.mark.asyncio
    async def test_create_analysis(self, analysis_repo, mock_session):
        """Test creating job analysis"""
        analysis_data = {
            "job_id": 1,
            "match_score": 85.5,
            "analysis_data": {"skills": ["Python", "Django"]}
        }
        
        analysis = await analysis_repo.create(**analysis_data)
        
        assert analysis.match_score == 85.5
        mock_session.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_analysis_by_job(self, analysis_repo, mock_session):
        """Test getting analysis by job ID"""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = MagicMock(
            job_id=1,
            match_score=85.5
        )
        mock_session.execute.return_value = mock_result
        
        analysis = await analysis_repo.get_by_job_id(1)
        
        assert analysis is not None
        assert analysis.job_id == 1
    
    @pytest.mark.asyncio
    async def test_get_high_scoring_analyses(self, analysis_repo, mock_session):
        """Test getting high-scoring analyses"""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            MagicMock(match_score=90),
            MagicMock(match_score=85)
        ]
        mock_session.execute.return_value = mock_result
        
        analyses = await analysis_repo.get_high_scoring(min_score=80)
        
        assert len(analyses) == 2
        assert all(a.match_score >= 80 for a in analyses)


class TestNotificationRepository:
    """Test NotificationRepository"""
    
    @pytest.fixture
    def mock_session(self):
        """Create mock database session"""
        session = MagicMock()
        session.execute = AsyncMock()
        session.commit = AsyncMock()
        return session
    
    @pytest.fixture
    def notification_repo(self, mock_session):
        """Create NotificationRepository instance"""
        from repositories.notification_repository import NotificationRepository
        return NotificationRepository(mock_session)
    
    @pytest.mark.asyncio
    async def test_create_notification(self, notification_repo, mock_session):
        """Test creating notification"""
        notification_data = {
            "user_id": 1,
            "title": "New Job Match",
            "message": "Found a job matching your profile",
            "type": "job_match"
        }
        
        notification = await notification_repo.create(**notification_data)
        
        assert notification.title == "New Job Match"
        mock_session.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_user_notifications(self, notification_repo, mock_session):
        """Test getting user notifications"""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            MagicMock(user_id=1, title="Notification 1"),
            MagicMock(user_id=1, title="Notification 2")
        ]
        mock_session.execute.return_value = mock_result
        
        notifications = await notification_repo.get_by_user(1)
        
        assert len(notifications) == 2
    
    @pytest.mark.asyncio
    async def test_mark_as_read(self, notification_repo, mock_session):
        """Test marking notification as read"""
        notification = MagicMock(id=1, read=False)
        
        await notification_repo.mark_as_read(notification)
        
        assert notification.read is True
        mock_session.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_unread_count(self, notification_repo, mock_session):
        """Test getting unread notification count"""
        mock_result = MagicMock()
        mock_result.scalar.return_value = 5
        mock_session.execute.return_value = mock_result
        
        count = await notification_repo.get_unread_count(1)
        
        assert count == 5


class TestProfileRepository:
    """Test ProfileRepository"""
    
    @pytest.fixture
    def mock_session(self):
        """Create mock database session"""
        session = MagicMock()
        session.execute = AsyncMock()
        session.commit = AsyncMock()
        return session
    
    @pytest.fixture
    def profile_repo(self, mock_session):
        """Create ProfileRepository instance"""
        from repositories.profile_repository import ProfileRepository
        return ProfileRepository(mock_session)
    
    @pytest.mark.asyncio
    async def test_create_profile(self, profile_repo, mock_session):
        """Test creating user profile"""
        profile_data = {
            "user_id": 1,
            "skills": ["Python", "Django", "Docker"],
            "experience_years": 5,
            "preferred_locations": ["Remote", "San Francisco"]
        }
        
        profile = await profile_repo.create(**profile_data)
        
        assert profile.user_id == 1
        assert len(profile.skills) == 3
        mock_session.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_profile_by_user(self, profile_repo, mock_session):
        """Test getting profile by user ID"""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = MagicMock(
            user_id=1,
            skills=["Python", "Django"]
        )
        mock_session.execute.return_value = mock_result
        
        profile = await profile_repo.get_by_user_id(1)
        
        assert profile is not None
        assert profile.user_id == 1
    
    @pytest.mark.asyncio
    async def test_update_skills(self, profile_repo, mock_session):
        """Test updating profile skills"""
        profile = MagicMock(skills=["Python"])
        
        updated_profile = await profile_repo.update(
            profile,
            skills=["Python", "Django", "Docker"]
        )
        
        assert len(updated_profile.skills) == 3
        mock_session.commit.assert_called_once()


class TestApplicationRepository:
    """Test ApplicationRepository"""
    
    @pytest.fixture
    def mock_session(self):
        """Create mock database session"""
        session = MagicMock()
        session.execute = AsyncMock()
        session.commit = AsyncMock()
        return session
    
    @pytest.fixture
    def application_repo(self, mock_session):
        """Create ApplicationRepository instance"""
        from repositories.application_repository import ApplicationRepository
        return ApplicationRepository(mock_session)
    
    @pytest.mark.asyncio
    async def test_create_application(self, application_repo, mock_session):
        """Test creating job application"""
        application_data = {
            "user_id": 1,
            "job_id": 1,
            "status": "pending",
            "applied_at": datetime.utcnow()
        }
        
        application = await application_repo.create(**application_data)
        
        assert application.status == "pending"
        mock_session.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_user_applications(self, application_repo, mock_session):
        """Test getting user applications"""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            MagicMock(user_id=1, status="pending"),
            MagicMock(user_id=1, status="accepted")
        ]
        mock_session.execute.return_value = mock_result
        
        applications = await application_repo.get_by_user(1)
        
        assert len(applications) == 2
    
    @pytest.mark.asyncio
    async def test_update_application_status(self, application_repo, mock_session):
        """Test updating application status"""
        application = MagicMock(status="pending")
        
        updated_app = await application_repo.update(application, status="accepted")
        
        assert updated_app.status == "accepted"
        mock_session.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_applications_by_status(self, application_repo, mock_session):
        """Test getting applications by status"""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            MagicMock(status="pending"),
            MagicMock(status="pending")
        ]
        mock_session.execute.return_value = mock_result
        
        applications = await application_repo.get_by_status("pending")
        
        assert len(applications) == 2
        assert all(app.status == "pending" for app in applications)


class TestRepositoryBase:
    """Test base repository functionality"""
    
    @pytest.fixture
    def mock_session(self):
        """Create mock database session"""
        session = MagicMock()
        session.execute = AsyncMock()
        session.commit = AsyncMock()
        session.rollback = AsyncMock()
        return session
    
    def test_repository_initialization(self, mock_session):
        """Test repository initialization"""
        from repositories.base_repository import BaseRepository
        
        repo = BaseRepository(mock_session)
        
        assert repo.session == mock_session
    
    @pytest.mark.asyncio
    async def test_transaction_commit(self, mock_session):
        """Test transaction commit"""
        from repositories.base_repository import BaseRepository
        
        repo = BaseRepository(mock_session)
        await repo.commit()
        
        mock_session.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_transaction_rollback(self, mock_session):
        """Test transaction rollback"""
        from repositories.base_repository import BaseRepository
        
        repo = BaseRepository(mock_session)
        await repo.rollback()
        
        mock_session.rollback.assert_called_once()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
