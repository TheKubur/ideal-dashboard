import os

ranges = {
    "js/main.js": (1, 50),
    "js/config.js": (51, 178),
    "js/globals.js": (179, 200),
    "js/ui/whitelabel.js": (201, 384),
    "js/utils.js": (385, 461),
    "js/auth.js": (462, 567),
    "js/ui/dashboard.js": (568, 733),
    "js/ui/activity_modal.js": (734, 998),
    "js/database.js": (999, 1053),
    "js/ui/kanban.js": (1054, 1178),
    "js/ui/companies.js": (1179, 1304),
    "js/ui/weekly.js": (1305, 1376),
    "js/ui/badges.js": (1377, 1397),
    "js/ui/meeting_notes.js": (1398, 1435),
    "js/ui/charts.js": (1436, 1563),
    "js/ui/dashboard_helpers.js": (1564, 1579),
    "js/ui/calendar.js": (1580, 1814),
    "js/ui/outlook.js": (1815, 1961),
    "js/ui/private_notes.js": (1962, 2049),
    "js/ui/glow.js": (2050, 2075),
    "js/ui/kanban_drag.js": (2076, 2110),
    "js/ui/pipeline.js": (2111, 2284),
    "js/ui/assignments.js": (2285, 2324),
    "js/ui/projects.js": (2325, 2553),
    "js/ui/analytics.js": (2554, 2722),
    "js/ui/okr.js": (2723, 2890),
    "js/ui/lost_sale.js": (2891, 2936),
    "js/ui/chatbot.js": (2937, 3182) # Assuming 3182 is the end
}

os.makedirs('js/ui', exist_ok=True)

with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for filepath, (start, end) in ranges.items():
    with open(filepath, 'w', encoding='utf-8') as f:
        # lines list is 0-indexed, line numbers are 1-indexed
        f.writelines(lines[start-1:end])

print("Splitting complete.")
