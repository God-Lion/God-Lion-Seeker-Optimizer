"""Simple test to verify pytest works"""
import pytest


def test_simple():
    """Simple passing test"""
    assert 1 + 1 == 2


def test_simple_2():
    """Another simple test"""
    assert "hello" == "hello"


class TestBasic:
    """Basic test class"""
    
    def test_method(self):
        """Test method"""
        assert True
