# Amul Lassi Stock Watch

Free, zero-Claude-token stock checker for:
- https://shop.amul.com/en/product/amul-high-protein-plain-lassi-200-ml-or-pack-of-30
- https://shop.amul.com/en/product/amul-high-protein-rose-lassi-200-ml-or-pack-of-30

To watch more products later, add a `KEY|Label|URL` line to the `PRODUCTS`
block near the top of `.github/workflows/check-stock.yml` — no other
changes needed.

Runs entirely on GitHub Actions' free tier (checks every 10 min) and pushes
a free notification via ntfy.sh the moment the "Sold Out" text disappears
from the page. No servers, no paid APIs, no Claude usage after setup.

## Getting the notification on your phone

This uses **ntfy.sh**, a free, no-signup push notification service.

- Topic: `amul-lassi-ir-f3f4ec47`
- Install the **ntfy** app (Android/iOS) and subscribe to that topic, OR
  just open `https://ntfy.sh/amul-lassi-ir-f3f4ec47` in a browser tab.
- You'll get an urgent push the instant a product goes in stock, with a
  direct link to buy.

## How it works

- Every 10 minutes, a GitHub Actions runner fetches each product page and
  checks for the text "Sold Out".
- It compares this to the last known state (stored in `status.txt`) so it
  only fires a notification on the OUT → IN transition, not every run.

## Adjusting

- Check frequency: edit the `cron` line in the workflow.
- Notification channel: swap the `curl ... ntfy.sh` step for any other
  free webhook if you'd rather get the alert there instead.

