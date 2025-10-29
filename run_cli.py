"""
Easy CLI runner - Use this to run the scraper CLI
Usage: python run_cli.py scrape "Python Developer" --limit 50
"""
import sys
from src.cli.scraper_cli import main

if __name__ == "__main__":
    main()
