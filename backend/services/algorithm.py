from sqlalchemy.orm import Session
from models import Place
from geoalchemy2.functions import ST_DWithin, ST_MakePoint, ST_SetSRID


def get_personalized_route(db: Session, lat: float, lon: float, preferences: list, duration_type: str = "medium",
                           radius_km: int = 5):
    # Налаштування радіуса та ліміту точок залежно від часу прогулянки
    settings = {
        "short": {"radius": 2500, "limit": 3},
        "medium": {"radius": 5000, "limit": 7},
        "long": {"radius": 10000, "limit": 12}
    }
    conf = settings.get(duration_type, settings["medium"])

    # Використовуємо ST_SetSRID 4326 для уникнення помилок Mixed SRID
    user_point = ST_SetSRID(ST_MakePoint(lon, lat), 4326)

    return db.query(Place).filter(
        ST_DWithin(Place.location, user_point, conf["radius"]),
        Place.category.in_(preferences)
    ).order_by(Place.rating.desc()).limit(conf["limit"]).all()