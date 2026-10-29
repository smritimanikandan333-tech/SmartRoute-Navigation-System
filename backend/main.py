
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.graph_engine import (
    LOCATIONS,
    get_locations,
    get_roads,
    find_shortest_route,
    find_fastest_route,
    block_road,
    reset_roads,
    get_analytics,
    simulate_live_traffic,
)

app = FastAPI(
    title="SmartRoute Traffic Navigation API",
    version="0.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RouteRequest(BaseModel):
    source: str
    destination: str


@app.get("/")
def home():
    return {
        "message": "SmartRoute Backend is running!",
        "status": "success"
    }


@app.get("/locations")
def locations():
    return get_locations()


@app.get("/roads")
def roads():
    return get_roads()


@app.get("/incidents")
def incidents():
    return [
        {
            "start": start,
            "end": end,
            "start_name": start_name,
            "end_name": end_name,
        }
        for start, end, start_name, end_name in [
            (
                road["start"],
                road["end"],
                road["start_name"],
                road["end_name"],
            )
            for road in get_roads()
            if road["blocked"]
        ]
    ]


@app.post("/routes")
def shortest_route(request: RouteRequest):
    try:
        return find_shortest_route(
            request.source,
            request.destination
        )
    except (ValueError, Exception) as error:
        raise HTTPException(status_code=400, detail=str(error))


@app.post("/fastest-route")
def fastest_route(request: RouteRequest):
    try:
        return find_fastest_route(
            request.source,
            request.destination
        )
    except (ValueError, Exception) as error:
        raise HTTPException(status_code=400, detail=str(error))


@app.post("/simulate")
def simulate(request: RouteRequest):
    try:
        result = block_road(
            request.source,
            request.destination
        )
        return result
    except (ValueError, Exception) as error:
        raise HTTPException(status_code=400, detail=str(error))


@app.post("/reset")
def reset():
    return reset_roads()


@app.get("/analytics")
def analytics():
    return get_analytics()


@app.post("/simulate-live-traffic")
def live_traffic():
    return simulate_live_traffic()


@app.post("/compare-routes")
def compare_routes(request: RouteRequest):
    try:
        shortest = find_shortest_route(
            request.source,
            request.destination
        )
        fastest = find_fastest_route(
            request.source,
            request.destination
        )

        return {
            "shortest_route": shortest,
            "fastest_route": fastest,
            "comparison": {
                "distance_difference_km": round(
                    shortest["distance_km"] -
                    fastest["distance_km"],
                    2
                ),
                "estimated_time_saved_min": round(
                    shortest["estimated_time_min"] -
                    fastest["estimated_time_min"],
                    1
                ),
            }
        }
    except (ValueError, Exception) as error:
        raise HTTPException(status_code=400, detail=str(error))
