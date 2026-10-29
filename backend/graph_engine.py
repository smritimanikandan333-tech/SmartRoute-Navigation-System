
import math
import random
import networkx as nx

road_graph = nx.Graph()

# Location ID, display name, latitude, longitude
LOCATIONS = [
    ("salem_junction", "Salem Junction", 11.6643, 78.1460),
    ("new_bus_stand", "Salem New Bus Stand", 11.6700, 78.1360),
    ("old_bus_stand", "Salem Old Bus Stand", 11.6570, 78.1600),
    ("collectorate", "Salem Collectorate", 11.6559, 78.1567),
    ("govt_hospital", "Government Mohan Kumaramangalam Hospital", 11.6530, 78.1610),
    ("sks_hospital", "SKS Hospital", 11.6720, 78.1450),
    ("sugavaneswarar", "Sugavaneswarar Temple", 11.6570, 78.1600),
    ("kottai_mariamman", "Kottai Mariamman Temple", 11.6530, 78.1570),
    ("rajaganapathi", "Rajaganapathi Temple", 11.6540, 78.1590),
    ("alagirinathar", "Alagirinathar Temple", 11.6540, 78.1550),
    ("fairlands", "Fairlands", 11.6690, 78.1500),
    ("five_roads", "Five Roads Junction", 11.6690, 78.1450),
    ("junction_road", "Junction Road", 11.6630, 78.1480),
    ("suramangalam", "Suramangalam", 11.6590, 78.1300),
    ("hasthampatti", "Hasthampatti", 11.6760, 78.1610),
    ("kannankurichi", "Kannankurichi", 11.6983, 78.1769),
    ("gugai", "Gugai", 11.6480, 78.1640),
    ("shevapet", "Shevapet", 11.6550, 78.1640),
    ("ammapet", "Ammapet", 11.6471, 78.1831),
    ("kondalampatti", "Kondalampatti", 11.6250, 78.1400),
    ("seelanaickenpatti", "Seelanaickenpatti", 11.6300, 78.1700),
    ("udhaya_patti", "Udayapatti", 11.6500, 78.2000),
    ("kumaragiri", "Kumaragiri Murugan Temple", 11.6510, 78.2030),
    ("kandashramam", "Kandashramam", 11.6554, 78.2125),
    ("ootumalai", "Oothumalai", 11.6400, 78.1800),
    ("mamangam", "Mamangam", 11.6859, 78.1138),
    ("alagapuram", "Alagapuram", 11.6792, 78.1422),
    ("periyaputhur", "Alagapuram Periyaputhur", 11.6770, 78.1450),
    ("kandampatti", "Kandampatti", 11.6571, 78.1192),
    ("steel_plant", "Salem Steel Plant", 11.6661, 78.0350),
    ("magnesite", "Magnesite Mines", 11.6935, 78.1001),
    ("airport", "Salem Airport", 11.7830, 78.0650),
    ("yercaud_foothills", "Yercaud Foothills", 11.7500, 78.1800),
    ("kurumbapatti", "Kurumbapatti Zoological Park", 11.5811, 77.8767),
    ("ayodhyapattinam", "Ayodhyapattinam", 11.7000, 78.2000),
    ("ariyanoor", "1008 Lingam Temple, Ariyanoor", 11.6000, 78.1000),
    ("siddhar_kovil", "Siddhar Temple", 11.7000, 78.0500),
    ("fort", "Salem Fort", 11.6528, 78.1551),
    ("town_hall", "Town Hall", 11.6550, 78.1610),
    ("leigh_bazaar", "Leigh Bazaar", 11.6558, 78.1411),
    ("anna_park", "Anna Park, Yercaud", 11.7750, 78.2100),
    ("ladys_seat", "Lady's Seat, Yercaud", 11.7700, 78.2150),
    ("pagoda_point", "Pagoda Point, Yercaud", 11.7900, 78.2300),
    ("yercaud_lake", "Yercaud Lake", 11.7750, 78.2090),
    ("omalar", "Omalur", 11.7400, 78.0450),
    ("attur", "Attur", 11.5950, 78.6010),
    ("mettur", "Mettur", 11.7870, 77.8000),
    ("sankagiri", "Sankagiri", 11.4800, 77.8700),
    ("tharamangalam", "Tharamangalam", 11.6970, 77.9700),
    ("belur", "Belur", 11.7000, 78.4000),
]


def distance_km(a, b):
    """Calculate approximate straight-line distance."""
    lat1, lon1 = map(math.radians, a)
    lat2, lon2 = map(math.radians, b)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    value = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )

    return 6371 * 2 * math.asin(math.sqrt(value))


def build_graph():
    road_graph.clear()

    for location_id, name, lat, lon in LOCATIONS:
        road_graph.add_node(
            location_id,
            name=name,
            latitude=lat,
            longitude=lon,
        )

    # Demo network: connect each location to its 3 nearest locations.
    for location_id, name, lat, lon in LOCATIONS:
        candidates = []

        for other_id, other_name, other_lat, other_lon in LOCATIONS:
            if location_id == other_id:
                continue

            distance = distance_km(
                (lat, lon),
                (other_lat, other_lon),
            )
            candidates.append((distance, other_id))

        for distance, other_id in sorted(candidates)[:3]:
            if road_graph.has_edge(location_id, other_id):
                continue

            road_graph.add_edge(
                location_id,
                other_id,
                distance=round(max(distance, 0.5), 2),
                traffic=random.randint(5, 60),
                blocked=False,
            )


def get_locations():
    return [
        {
            "id": location_id,
            "name": name,
            "latitude": lat,
            "longitude": lon,
        }
        for location_id, name, lat, lon in LOCATIONS
    ]


def get_roads():
    return [
        {
            "start": start,
            "end": end,
            "start_name": road_graph.nodes[start]["name"],
            "end_name": road_graph.nodes[end]["name"],
            "distance": data["distance"],
            "distance_km": data["distance"],
            "traffic": data["traffic"],
            "blocked": data["blocked"],
            "status": "blocked" if data["blocked"] else "open",
        }
        for start, end, data in road_graph.edges(data=True)
    ]


def calculate_route(source, destination, fastest=False):
    if source not in road_graph or destination not in road_graph:
        raise ValueError("Please select valid locations.")

    if source == destination:
        name = road_graph.nodes[source]["name"]
        return {
            "route": [source],
            "route_names": [name],
            "distance_km": 0,
            "estimated_time_min": 0,
            "algorithm": "Traffic-aware Dijkstra" if fastest else "Dijkstra",
            "status": "success",
        }

    # Build a routing graph that excludes blocked connections.
    graph = nx.Graph()
    graph.add_nodes_from(road_graph.nodes(data=True))

    for start, end, data in road_graph.edges(data=True):
        if data["blocked"]:
            continue

        distance = data["distance"]
        traffic = data["traffic"]

        # Simulated speed model, not real measured traffic speed.
        speed = max(5, 40 * (1 - traffic / 125))
        travel_time = distance / speed * 60

        graph.add_edge(
            start,
            end,
            distance=distance,
            travel_time=travel_time,
        )

    try:
        weight = "travel_time" if fastest else "distance"
        path = nx.shortest_path(
            graph,
            source=source,
            target=destination,
            weight=weight,
            method="dijkstra",
        )
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        raise ValueError(
            "No available route. All connecting paths may be blocked."
        )

    total_distance = 0
    total_time = 0

    for start, end in zip(path, path[1:]):
        edge = graph[start][end]
        total_distance += edge["distance"]
        total_time += edge["travel_time"]

    return {
        "route": path,
        "route_names": [
            road_graph.nodes[node]["name"] for node in path
        ],
        "distance_km": round(total_distance, 2),
        "estimated_time_min": round(total_time, 1),
        "algorithm": "Traffic-aware Dijkstra" if fastest else "Dijkstra",
        "status": "success",
    }


def find_shortest_route(source, destination):
    return calculate_route(source, destination, fastest=False)


def find_fastest_route(source, destination):
    return calculate_route(source, destination, fastest=True)


def simulate_live_traffic():
    for _, _, data in road_graph.edges(data=True):
        if not data["blocked"]:
            data["traffic"] = random.randint(5, 95)

    return {
        "status": "success",
        "message": "Simulated traffic updated",
    }


def block_road(source, destination):
    if source not in road_graph or destination not in road_graph:
        raise ValueError("Please select valid locations.")

    if not road_graph.has_edge(source, destination):
        raise ValueError(
            "These locations do not have a direct connection in the demo network."
        )

    if road_graph[source][destination]["blocked"]:
        return {
            "status": "success",
            "message": "This connection is already blocked.",
            "source": source,
            "destination": destination,
        }

    road_graph[source][destination]["blocked"] = True

    return {
        "status": "success",
        "message": "Road connection blocked. Recalculate the route.",
        "source": source,
        "destination": destination,
    }


def reset_roads():
    for _, _, data in road_graph.edges(data=True):
        data["blocked"] = False
        data["traffic"] = random.randint(5, 60)

    return {
        "status": "success",
        "message": "Road network reset",
    }


def get_analytics():
    edges = list(road_graph.edges(data=True))
    total = len(edges)
    blocked = sum(
        1 for _, _, data in edges if data["blocked"]
    )
    open_edges = [
        data for _, _, data in edges if not data["blocked"]
    ]
    traffic_values = [
        data["traffic"] for data in open_edges
    ]

    return {
        "total_roads": total,
        "open_roads": len(open_edges),
        "blocked_roads": blocked,
        "average_traffic": round(
            sum(traffic_values) / len(traffic_values), 1
        ) if traffic_values else 0,
        "high_traffic_roads": sum(
            1 for value in traffic_values if value >= 40
        ),
        "network_health": round(
            len(open_edges) / total * 100, 1
        ) if total else 0,
    }


build_graph()
