"""
Utils package initialization
Provides easy access to document generation utilities
"""

# Resume customization utilities (required)
try:
    from .resume_customizer import ResumeCustomizer
    HAS_RESUME_CUSTOMIZER = True
except ImportError:
    HAS_RESUME_CUSTOMIZER = False
    print("Warning: ResumeCustomizer not available")

# Document generator (optional - requires reportlab)
try:
    from .document_generator import DocumentGenerator
    HAS_DOCUMENT_GENERATOR = True
except ImportError:
    HAS_DOCUMENT_GENERATOR = False
    print("Warning: DocumentGenerator not available (reportlab not installed)")

# Resume adapter (optional)
try:
    from .resume_adapter import ResumeAdapter
    HAS_RESUME_ADAPTER = True
except ImportError:
    HAS_RESUME_ADAPTER = False

# Build __all__ dynamically
__all__ = []
if HAS_RESUME_CUSTOMIZER:
    __all__.append('ResumeCustomizer')
if HAS_DOCUMENT_GENERATOR:
    __all__.append('DocumentGenerator')
if HAS_RESUME_ADAPTER:
    __all__.append('ResumeAdapter')
