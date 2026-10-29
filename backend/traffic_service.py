
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY")


async def get_live_traffic(latitude: float, longitude: float):
    if not TOMTOM_API_KEY:
        return {
            "status": "unavailable",
            "source": "TomTom Traffic API",
            "message": "API key not configured in .env"
        }

    url = (
        "https://api.tomtom.com/traffic/services/4/"
        "flowSegmentData/absolute/10/json"
    )

    params = {
        "key": TOMTOM_API_KEY,
        "point": f"{latitude},{longitude}",
        "unit": "KMPH"
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        flow = data.get("flowSegmentData", {})

        if not flow:
            return {
                "status": "unavailable",
                "source": "TomTom Traffic API",
                "message": "No traffic segment data returned"
            }

        current_speed = flow.get("currentSpeed")
        free_flow_speed = flow.get("freeFlowSpeed")

        return {
            "status": "live",
            "source": "TomTom Traffic API",
            "current_speed_kmph": current_speed,
            "free_flow_speed_kmph": free_flow_speed,
            "current_travel_time_seconds": flow.get("currentTravelTime"),
            "free_flow_travel_time_seconds": flow.get("freeFlowTravelTime"),
            "confidence": flow.get("confidence"),
            "road_closure": flow.get("roadClosure"),
            "coordinates": flow.get("coordinates")
        }

    except httpx.HTTPStatusError as error:
        return {
            "status": "unavailable",
            "source": "TomTom Traffic API",
            "message": f"TomTom returned HTTP {error.response.status_code}"
        }

    except (httpx.RequestError, ValueError):
        return {
            "status": "unavailable",
            "source": "TomTom Traffic API",
            "message": "Could not retrieve valid traffic data"
        }
