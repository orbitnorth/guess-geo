import asyncio
import os
import json
import edge_tts

REACTIONS = {
    "great": [
        {"id": "great_1", "text": "Boom! Pure satellite sniper!"},
        {"id": "great_2", "text": "Holy pinpoint! Bullseye!"},
        {"id": "great_3", "text": "Spot on! Living in orbit?"},
        {"id": "great_4", "text": "Chef's kiss! FBI wants you."},
        {"id": "great_5", "text": "Perfection! Laser accuracy!"},
        {"id": "great_6", "text": "Insane guess! Absolute genius!"}
    ],
    "okay": [
        {"id": "okay_1", "text": "Close! Just a quick taxi ride."},
        {"id": "okay_2", "text": "Right neighborhood, wrong block!"},
        {"id": "okay_3", "text": "Not bad! At least you didn't drown."},
        {"id": "okay_4", "text": "Your GPS definitely needs coffee!"},
        {"id": "okay_5", "text": "Hey, points are points!"},
        {"id": "okay_6", "text": "Ballpark! Size of Brazil though."}
    ],
    "bad": [
        {"id": "bad_1", "text": "Did you sneeze while clicking?!"},
        {"id": "bad_2", "text": "Congrats, you found Atlantis!"},
        {"id": "bad_3", "text": "Bro planted his flag on Mars!"},
        {"id": "bad_4", "text": "Not even the same continent!"},
        {"id": "bad_5", "text": "Oof! Pack your swimming gear!"},
        {"id": "bad_6", "text": "Wrong hemisphere entirely!"}
    ],
    "duel_win": [
        {"id": "duel_win_1", "text": "Direct hit! Kaboom!"},
        {"id": "duel_win_2", "text": "Sent them to the stratosphere!"},
        {"id": "duel_win_3", "text": "Clinical strike! Flawless!"}
    ],
    "duel_loss": [
        {"id": "duel_loss_1", "text": "Ouch! That's gotta hurt!"},
        {"id": "duel_loss_2", "text": "Mayday! Health pool leaking!"},
        {"id": "duel_loss_3", "text": "Direct hit taken! Oof!"}
    ]
}

os.makedirs("public/audio/tts", exist_ok=True)
os.makedirs("src/data", exist_ok=True)

async def generate_all():
    total = sum(len(items) for items in REACTIONS.values())
    print(f"Generating {total} short voice clips with Edge Natural Voice (en-US-GuyNeural)...")
    count = 0
    for category, items in REACTIONS.items():
        for item in items:
            filepath = f"public/audio/tts/{item['id']}.mp3"
            comm = edge_tts.Communicate(item["text"], "en-US-GuyNeural", rate="+6%")
            await comm.save(filepath)
            item["audio"] = f"/audio/tts/{item['id']}.mp3"
            count += 1
            print(f"[{count}/{total}] Generated {item['id']}.mp3: \"{item['text']}\"")

    with open("src/data/reactions.json", "w", encoding="utf-8") as f:
        json.dump(REACTIONS, f, indent=2)
    print("Done! Short reaction audio and metadata saved.")

if __name__ == "__main__":
    asyncio.run(generate_all())
