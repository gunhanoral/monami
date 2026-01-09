# MPBGP EVPN Route Manager

> Important notice
> This project is written with help of generative AI.

Backend service for managing MPBGP EVPN routes, VRFs, Prefixes, and Route Targets using FastAPI and Neo4j.

## Prerequisites

- Python 3.10+
- `uv` (Universal Python Package Manager)
- Docker & Docker Compose

## Setup & Running

1. **Start Neo4j Database**

   ```bash
   docker-compose up -d
   ```
   This starts a local Neo4j instance on ports 7474 (HTTP) and 7687 (Bolt).
   Default credentials: `neo4j` / `password`.

2. **Run the Application**

   ```bash
   uv run uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

3. **Explore API Documentation**

   Visit [http://localhost:8000/docs](http://localhost:8000/docs) for the interactive Swagger UI.

## Data Model

- **VRF**: Virtual Routing and Forwarding instance. Unique by `(namespace, name)`.
- **RouteTarget**: Import/Export targets (e.g., `65000:100`).
- **Prefix**: IP CIDR blocks (e.g., `10.0.0.0/24`) belonging to a VRF.

## API Endpoints

- `GET /api/v1/vrfs/`: List VRFs (filter by namespace).
- `POST /api/v1/vrfs/`: Create a new VRF.
- `GET /api/v1/vrfs/{namespace}/{name}`: Get VRF details.
- `DELETE /api/v1/vrfs/{namespace}/{name}`: Delete a VRF.
- `POST /api/v1/vrfs/.../targets/import`: Add import RT.
- `POST /api/v1/vrfs/.../targets/export`: Add export RT.
- `POST /api/v1/vrfs/.../prefixes`: Add prefix.

## Generating Sample Data

A script is provided to generate sample data for testing and development:

```bash
# Generate 5 VRFs with default settings
python scripts/generate_data.py

# Customize the generation
python scripts/generate_data.py --num-vrfs 10 --namespace production --imports 3 --exports 3 --prefixes 5

# Use a different API URL
python scripts/generate_data.py --api-url http://localhost:8000
```

Options:
- `--api-url`: Base URL of the API (default: http://localhost:8000)
- `--num-vrfs`: Number of VRFs to create (default: 5)
- `--namespace`: Namespace for VRFs (default: default)
- `--imports`: Number of import route targets per VRF (default: 2)
- `--exports`: Number of export route targets per VRF (default: 2)
- `--prefixes`: Number of prefixes per VRF (default: 3)
