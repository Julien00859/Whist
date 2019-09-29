import json

with open('scores.json') as f:
    scores = json.load(f)


def compute_score(bid, fold):
    if scores[bid]['type'] == 'solo':
        if fold >= scores[bid]['fold']:
            return (12 + 3 * (min(fold, 8) - 6), 0)
        else:
            return (-42 + (fold * 3) + (8 - scores[bid]['fold']) * 6,
                    (10 + (scores[bid]['fold'] - 6) * (scores[bid]['fold'] - 5))
                     + 2 * (scores[bid]['fold'] - fold - 1))
    elif scores[bid]['type'] == 'emballage':
        if fold == 13:
            return (30, 0)
        elif fold >= scores[bid]['fold']:
            return (7 + 3 * (fold - 8), 0)
        else:
            loose = -61 + (fold * 3) + (13 - scores[bid]['fold']) * 6
            return (loose, -loose)
    elif scores[bid]['type'] == 'trou':
        if fold >= scores[bid]['fold']:
            return 16, 0
        else:
            return 0, 16
    else:
        if fold >= score[bid]['fold']:
            return (scores[bid]['score']['us'], 0)
        else:
            return (-scores[bid]['score']['us'],
                    scores[bid]['score']['them'])
