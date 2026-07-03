# Donkey Pricing

Public pricing overview for Donkey Republic cities.

## Adding a new city

All city data lives in a single file: [`src/data/cities.json`](src/data/cities.json).

To add a city, edit that file on GitHub (pencil icon → edit) and add one line before the closing `]`:

```json
{ "name": "New City", "city_app_id": 999, "country": "NL", "lat": 52.1234, "lon": 4.5678, "radius": 5000 }
```

**Fields:**

| Field         | What it is                                                     | Example                |
| ------------- | -------------------------------------------------------------- | ---------------------- |
| `name`        | Display name shown in the dropdown                             | `"Amsterdam"`          |
| `city_app_id` | Donkey Republic app ID for the city                            | `5`                    |
| `country`     | ISO 2-letter country code (`NL`, `DK`, `BE`, `DE`, `FI`, `CH`, `ES`, `SE`) | `"NL"`     |
| `lat`         | Latitude of the city centre                                    | `52.3702157`           |
| `lon`         | Longitude of the city centre                                   | `4.8951679`            |
| `radius`      | Search radius in metres for day-deals (usually `5000` or `10000` for regions) | `5000` |

**Don't forget the comma** at the end of the line above the one you added.

Once merged to `main`, the pricing JSON regenerates automatically and the site picks up the new city.

## Local development

```bash
npm install
npm run dev              # starts vite dev server
node scripts/generatePricingJsonStandalone.cjs  # regenerate public/pricing.json
```
