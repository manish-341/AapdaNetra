
import os
import math
import gzip
import struct
import numpy as np


SRTM_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "srtm"
)


# SRTM 1-arc-second tiles contain 3601 x 3601 elevation samples.
SRTM_SIZE = 3601


def _tile_name(latitude, longitude):
    """
    Return the SRTM tile name containing the coordinate.
    """

    lat = math.floor(float(latitude))
    lon = math.floor(float(longitude))

    lat_prefix = "N" if lat >= 0 else "S"
    lon_prefix = "E" if lon >= 0 else "W"

    return (
        f"{lat_prefix}{abs(lat):02d}"
        f"{lon_prefix}{abs(lon):03d}"
    )


def _tile_path(tile_name):
    """
    Locate either .hgt or .hgt.gz SRTM tile.
    """

    hgt_path = os.path.join(
        SRTM_DIR,
        tile_name + ".hgt"
    )

    gz_path = os.path.join(
        SRTM_DIR,
        tile_name + ".hgt.gz"
    )

    if os.path.exists(hgt_path):
        return hgt_path

    if os.path.exists(gz_path):
        return gz_path

    return None


def _read_elevation(tile_path, latitude, longitude):
    """
    Read bilinear-interpolated SRTM elevation.
    """

    tile_name = os.path.basename(
        tile_path
    ).replace(".hgt.gz", "").replace(".hgt", "")

    lat_degree = int(
        tile_name[1:3]
    )

    lon_degree = int(
        tile_name[4:7]
    )

    lat_fraction = float(latitude) - lat_degree
    lon_fraction = float(longitude) - lon_degree

    # SRTM rows run from north to south.
    row_float = (
        (1.0 - lat_fraction) *
        (SRTM_SIZE - 1)
    )

    col_float = (
        lon_fraction *
        (SRTM_SIZE - 1)
    )

    row0 = int(
        np.floor(row_float)
    )

    col0 = int(
        np.floor(col_float)
    )

    row1 = min(
        row0 + 1,
        SRTM_SIZE - 1
    )

    col1 = min(
        col0 + 1,
        SRTM_SIZE - 1
    )

    row_fraction = (
        row_float - row0
    )

    col_fraction = (
        col_float - col0
    )

    def read_value(row, col):

        offset = (
            (row * SRTM_SIZE + col) * 2
        )

        if tile_path.endswith(".gz"):

            with gzip.open(
                tile_path,
                "rb"
            ) as f:
                f.seek(offset)
                raw = f.read(2)

        else:

            with open(
                tile_path,
                "rb"
            ) as f:
                f.seek(offset)
                raw = f.read(2)

        if len(raw) != 2:
            raise ValueError(
                "Unable to read SRTM elevation."
            )

        value = struct.unpack(
            ">h",
            raw
        )[0]

        # SRTM void value
        if value == -32768:
            return np.nan

        return float(value)

    z00 = read_value(row0, col0)
    z01 = read_value(row0, col1)
    z10 = read_value(row1, col0)
    z11 = read_value(row1, col1)

    values = np.array(
        [z00, z01, z10, z11],
        dtype=float
    )

    if np.any(np.isnan(values)):
        raise ValueError(
            "SRTM elevation contains a void "
            "around the requested coordinate."
        )

    elevation = (
        z00 * (1 - row_fraction) * (1 - col_fraction)
        + z01 * (1 - row_fraction) * col_fraction
        + z10 * row_fraction * (1 - col_fraction)
        + z11 * row_fraction * col_fraction
    )

    return float(elevation)


def _read_point_elevation(latitude, longitude):
    """
    Read elevation at a single coordinate from local SRTM.
    """

    tile_name = _tile_name(
        latitude,
        longitude
    )

    tile_path = _tile_path(
        tile_name
    )

    if tile_path is None:
        raise FileNotFoundError(
            f"SRTM tile not found for "
            f"{latitude}, {longitude}: "
            f"{tile_name}"
        )

    elevation = _read_elevation(
        tile_path,
        latitude,
        longitude
    )

    return elevation


def _get_online_terrain(latitude, longitude, sample_distance_deg=0.001):
    """
    Fallback to Open-Meteo global elevation when local SRTM tile is absent.
    Calculates elevation and local slope using central differences.
    """
    try:
        import requests
        delta = sample_distance_deg
        lats = [latitude, latitude + delta, latitude - delta, latitude, latitude]
        lons = [longitude, longitude, longitude, longitude + delta, longitude - delta]
        resp = requests.get(
            "https://api.open-meteo.com/v1/elevation",
            params={
                "latitude": ",".join(map(str, lats)),
                "longitude": ",".join(map(str, lons))
            },
            timeout=5
        )
        if resp.status_code == 200:
            elevs = resp.json().get("elevation", [])
            if len(elevs) == 5 and all(e is not None for e in elevs):
                center, north, south, east, west = elevs
                dy = 2.0 * delta * 111320.0
                dx = 2.0 * delta * 111320.0 * math.cos(math.radians(latitude))
                dz_dy = (north - south) / dy
                dz_dx = (east - west) / dx
                slope = math.degrees(math.atan(math.sqrt(dz_dx ** 2 + dz_dy ** 2)))
                return {
                    "srtm_elevation_m": round(float(center), 3),
                    "srtm_slope_deg": round(float(slope), 6),
                    "terrain_source": "Open-Meteo Elevation (SRTM Fallback)"
                }
    except Exception:
        pass
    return None


def get_terrain(
    latitude,
    longitude,
    sample_distance_deg=0.0005
):
    """
    Get elevation and a local slope estimate.

    First attempts local SRTM HGT tile (1-arc-second resolution).
    If the tile is not present locally, seamlessly falls back to
    global high-resolution elevation service to compute slope.
    """

    latitude = float(latitude)
    longitude = float(longitude)

    if not (-90 <= latitude <= 90):
        raise ValueError(
            "Latitude must be between -90 and 90."
        )

    if not (-180 <= longitude <= 180):
        raise ValueError(
            "Longitude must be between -180 and 180."
        )

    tile_name = _tile_name(latitude, longitude)
    tile_path = _tile_path(tile_name)

    if tile_path is None:
        online = _get_online_terrain(latitude, longitude)
        if online is not None:
            return online
        raise FileNotFoundError(
            f"SRTM tile {tile_name} not found locally and online elevation fallback unavailable."
        )

    center = _read_point_elevation(
        latitude,
        longitude
    )

    north = _read_point_elevation(
        latitude + sample_distance_deg,
        longitude
    )

    south = _read_point_elevation(
        latitude - sample_distance_deg,
        longitude
    )

    east = _read_point_elevation(
        latitude,
        longitude + sample_distance_deg
    )

    west = _read_point_elevation(
        latitude,
        longitude - sample_distance_deg
    )

    # Approximate metres per degree.
    meters_per_degree_lat = 111320.0

    meters_per_degree_lon = (
        111320.0 *
        math.cos(
            math.radians(latitude)
        )
    )

    dy = (
        2.0 *
        sample_distance_deg *
        meters_per_degree_lat
    )

    dx = (
        2.0 *
        sample_distance_deg *
        meters_per_degree_lon
    )

    dz_dy = (
        (north - south) / dy
    )

    dz_dx = (
        (east - west) / dx
    )

    slope_radians = math.atan(
        math.sqrt(
            dz_dx ** 2 +
            dz_dy ** 2
        )
    )

    slope_deg = math.degrees(
        slope_radians
    )

    return {
        "srtm_elevation_m": round(
            float(center),
            3
        ),
        "srtm_slope_deg": round(
            float(slope_deg),
            6
        )
    }
