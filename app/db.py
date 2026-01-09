from neomodel import config
import os

def connect_db():
    # Default to localhost for local development if not set
    # Using 'bolt' protocol. Note: neomodel uses 'neo4j+s' or 'bolt' etc.
    # Docker compose maps 7687.
    db_url = os.environ.get("NEO4J_BOLT_URL", "bolt://neo4j:password@localhost:7687")
    config.DATABASE_URL = db_url
