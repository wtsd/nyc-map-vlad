from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
PLACES_DIR = ROOT / "places"

ADDRESSES = {
    "alwyn-court": "180 W 58th St, New York, NY 10019",
    "american-museum-of-natural-history": "200 Central Park W, New York, NY 10024",
    "aragvi": "230 Park Ave South, New York, NY 10003",
    "bethesda-fountain": "Central Park, Terrace Dr, New York, NY 10021",
    "brighton-beach": "Brighton Beach Ave & Boardwalk, Brooklyn, NY 11235",
    "bronx-museum-of-the-arts": "1040 Grand Concourse, Bronx, NY 10456",
    "bronx-zoo": "2300 Southern Blvd, Bronx, NY 10460",
    "brooklyn-botanic-garden": "990 Washington Ave, Brooklyn, NY 11225",
    "brooklyn-bridge": "Brooklyn Bridge Pedestrian Entrance, New York, NY 10038",
    "brooklyn-museum": "200 Eastern Pkwy, Brooklyn, NY 11238",
    "bryant-park": "Bryant Park, New York, NY 10018",
    "cathedral-of-st-john-the-divine": "1047 Amsterdam Ave, New York, NY 10025",
    "central-park-mall": "The Mall, Central Park, New York, NY 10022",
    "central-park-zoo": "East 64th St, New York, NY 10021",
    "chelsea-market": "75 9th Ave, New York, NY 10011",
    "chinatown": "Canal St & Mott St, New York, NY 10013",
    "chrysler-building": "405 Lexington Ave, New York, NY 10174",
    "coney-island": "Surf Ave & Stillwell Ave, Brooklyn, NY 11224",
    "conwell-coffee-hall": "6 Hanover St, New York, NY 10005",
    "dumbo": "Washington St & Water St, Brooklyn, NY 11201",
    "elevated-acre": "55 Water St, New York, NY 10041",
    "ellis-island": "Ellis Island, New York, NY 10004",
    "empire-state-building": "20 W 34th St, New York, NY 10001",
    "federal-reserve": "33 Liberty St, New York, NY 10045",
    "flatiron-building": "175 5th Ave, New York, NY 10010",
    "ghostbusters-firehouse": "14 N Moore St, New York, NY 10013",
    "governors-island": "Governors Island Ferry Terminal, New York, NY 10004",
    "grand-central-terminal": "89 E 42nd St, New York, NY 10017",
    "guggenheim-museum": "1071 5th Ave, New York, NY 10128",
    "harry-potter-store": "935 Broadway, New York, NY 10010",
    "high-line": "Gansevoort St Entrance, New York, NY 10014",
    "hudson-yards": "20 Hudson Yards, New York, NY 10001",
    "intrepid-museum": "Pier 86, W 46th St, New York, NY 10036",
    "janes-carousel": "1 Old Dock St, Brooklyn, NY 11201",
    "joes-home-of-soup-dumplings": "24 W 56th St, New York, NY 10019",
    "krispy-kreme-times-square": "1601 Broadway, New York, NY 10019",
    "lego-store-5th-ave": "636 5th Ave, New York, NY 10020",
    "liberty-bagels-midtown": "260 W 35th St, New York, NY 10001",
    "lincoln-center": "Lincoln Center Plaza, New York, NY 10023",
    "little-island": "Pier 55, Hudson River Greenway, New York, NY 10014",
    "little-italy": "Mulberry St & Grand St, New York, NY 10013",
    "louis-vuitton-5th-ave": "1 E 57th St, New York, NY 10022",
    "luna-park": "1000 Surf Ave, Brooklyn, NY 11224",
    "madison-square-garden": "4 Pennsylvania Plaza, New York, NY 10001",
    "manhattan-bridge-view": "Washington St & Front St, Brooklyn, NY 11201",
    "meat-me-bbq": "136-20 Roosevelt Ave, Flushing, NY 11354",
    "memorial-911": "180 Greenwich St, New York, NY 10007",
    "mercer-labs": "21 Dey St, New York, NY 10007",
    "met-museum": "1000 5th Ave, New York, NY 10028",
    "mixue": "54 Bayard St, New York, NY 10013",
    "mms-store": "1600 Broadway, New York, NY 10019",
    "moma": "11 W 53rd St, New York, NY 10019",
    "morningside-park": "Morningside Ave & W 114th St, New York, NY 10027",
    "museum-of-the-city-of-new-york": "1220 5th Ave, New York, NY 10029",
    "nathans-famous": "1310 Surf Ave, Brooklyn, NY 11224",
    "new-yorker-hotel": "481 8th Ave, New York, NY 10001",
    "nonnas-of-the-world": "75 Kenmare St, New York, NY 10012",
    "ny-aquarium": "602 Surf Ave, Brooklyn, NY 11224",
    "ny-public-library": "476 5th Ave, New York, NY 10018",
    "nyse": "11 Wall St, New York, NY 10005",
    "nyu": "Washington Square Park area, New York, NY 10012",
    "oculus": "185 Greenwich St, New York, NY 10007",
    "ole-and-steen": "80 W 40th St, New York, NY 10018",
    "one-world-trade-center": "285 Fulton St, New York, NY 10007",
    "penn-station": "8th Ave & W 31st St, New York, NY 10001",
    "rockefeller-center": "45 Rockefeller Plaza, New York, NY 10111",
    "rooftop-230-fifth": "230 5th Ave, New York, NY 10001",
    "roosevelt-island": "Roosevelt Island, New York, NY 10044",
    "roosevelt-island-tram": "254 E 60th St, New York, NY 10022",
    "seaglass-carousel": "State St & Battery Pl, New York, NY 10004",
    "socrates-sculpture-park": "32-01 Vernon Blvd, Queens, NY 11106",
    "soho": "Broadway & Prince St, New York, NY 10012",
    "st-patricks-cathedral": "5th Ave & E 51st St, New York, NY 10022",
    "statue-of-liberty": "Liberty Island, New York, NY 10004",
    "tashkent-supermarket": "378 6th Ave, New York, NY 10011",
    "the-edge": "30 Hudson Yards, New York, NY 10001",
    "the-vessel": "20 Hudson Yards, New York, NY 10001",
    "times-square": "Times Square, New York, NY 10036",
    "trinity-church": "89 Broadway, New York, NY 10006",
    "unisphere": "Flushing Meadows Corona Park, Queens, NY 11368",
    "united-nations": "405 E 42nd St, New York, NY 10017",
    "wall-street-bull": "Bowling Green, New York, NY 10004",
    "washington-square-park": "Washington Square, New York, NY 10012",
    "whitney-museum": "99 Gansevoort St, New York, NY 10014",
}

def upsert_address(text: str, address: str) -> str:
    if re.search(r"^address:\s*", text, flags=re.MULTILINE):
        return re.sub(r"^address:\s*.*$", f'address: "{address}"', text, flags=re.MULTILINE)
    if not text.endswith("\n"):
        text += "\n"
    return text + f'address: "{address}"\n'

def main() -> None:
    updated = []
    missing = []
    meta_by_id = {
        path.parent.name: path
        for path in PLACES_DIR.rglob("meta.yml")
    }

    for place_id, address in ADDRESSES.items():
        meta_path = meta_by_id.get(place_id)
        if meta_path is None:
            missing.append(place_id)
            continue
        if not meta_path.exists():
            missing.append(place_id)
            continue

        original = meta_path.read_text(encoding="utf-8")
        new_text = upsert_address(original, address)

        if new_text != original:
            meta_path.write_text(new_text, encoding="utf-8")
            updated.append(place_id)

    print(f"Updated {len(updated)} place files.")
    if missing:
        print("Missing folders:")
        for item in missing:
            print(f"  - {item}")

if __name__ == "__main__":
    main()
