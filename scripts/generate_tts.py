import asyncio
import os
import json
import edge_tts

REACTIONS = {
    "great": [
        {"id": "great_1", "text": "Boom! Are you living in satellite orbit or what?"},
        {"id": "great_2", "text": "Holy geography! Did you drop that pin with a microscope?!"},
        {"id": "great_3", "text": "Spot on! Even the local street cats are clapping."},
        {"id": "great_4", "text": "Unbelievable! You just sniped that location from outer space!"},
        {"id": "great_5", "text": "Chef's kiss! The FBI wants to know your location, literally."},
        {"id": "great_6", "text": "Bullseye! Did you personally pave that road or something?"}
    ],
    "okay": [
        {"id": "okay_1", "text": "Well, same continent at least! A quick 40-hour taxi ride and you're there."},
        {"id": "okay_2", "text": "Close! If the Earth was ten times smaller, that would be a bullseye."},
        {"id": "okay_3", "text": "Not bad, not bad! You didn't drown in the ocean, so that's a win."},
        {"id": "okay_4", "text": "Right neighborhood, wrong country! Your GPS definitely needs coffee."},
        {"id": "okay_5", "text": "Hey, points are points! We won't tell anyone about the missing kilometers."},
        {"id": "okay_6", "text": "You're in the ballpark! Granted, the ballpark is the size of Brazil."}
    ],
    "bad": [
        {"id": "bad_1", "text": "Bro, did you sneeze while clicking?! You're in another hemisphere!"},
        {"id": "bad_2", "text": "Congratulations, you just discovered a brand new ocean! Completely wrong though."},
        {"id": "bad_3", "text": "Pack your scuba gear, because you just planted a flag in the middle of nowhere."},
        {"id": "bad_4", "text": "Are you on Earth, or did you accidentally drop your pin on Mars?!"},
        {"id": "bad_5", "text": "Oof! If you were any further, you'd be in a different solar system."},
        {"id": "bad_6", "text": "That's not even the same tectonic plate, my friend!"}
    ],
    "duel_win": [
        {"id": "duel_win_1", "text": "Direct hit! That's gotta hurt their geographical pride!"},
        {"id": "duel_win_2", "text": "Kaboom! Sent them flying halfway across the Pacific!"},
        {"id": "duel_win_3", "text": "Clinical strike! They didn't see that one coming."}
    ],
    "duel_loss": [
        {"id": "duel_loss_1", "text": "Ouch! You just got sent packing straight to the stratosphere!"},
        {"id": "duel_loss_2", "text": "Mayday, mayday! Your health pool is leaking like a broken faucet!"},
        {"id": "duel_loss_3", "text": "That's gotta sting! Time to dust off your atlas."}
    ]
}

os.makedirs("public/audio/tts", exist_ok=True)
os.makedirs("src/data", exist_ok=True)

async def generate_all():
    total = sum(len(items) for items in REACTIONS.values())
    print(f"Generating {total} voice clips with Edge Natural Voice (en-US-GuyNeural)...")
    count = 0
    for category, items in REACTIONS.items():
        for item in items:
            filepath = f"public/audio/tts/{item['id']}.mp3"
            comm = edge_tts.Communicate(item["text"], "en-US-GuyNeural", rate="+3%")
            await comm.save(filepath)
            item["audio"] = f"/audio/tts/{item['id']}.mp3"
            count += 1
            print(f"[{count}/{total}] Generated {item['id']}.mp3 ({item['text'][:35]}...)")

    with open("src/data/reactions.json", "w", encoding="utf-8") as f:
        json.dump(REACTIONS, f, indent=2)
    print("Done! Metadata saved to src/data/reactions.json")

if __name__ == "__main__":
    asyncio.run(generate_all())
