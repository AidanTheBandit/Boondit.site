---
title: "OpenClaw for dummies"
description: "Simple guide to OpenClaw setup, tips, and usage on Rabbit R1"
pubDate: "Feb 10 2026"
heroImage: "/image.png"
---
# <OpenClaw for dummies />

If you want a personal assistant that answers you on Discord (or other chat apps), OpenClaw is a clean way to do it. You run it on your computer and it behaves like your always on helper.

This guide keeps things simple and safe. No fancy stuff. Just the basics that work.

Full docs if you want them later: https://docs.openclaw.ai/

## <Step 1: Install />

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

If that runs clean, you are good.

## <Step 2: Run the onboarding />

This will guide you through setup. If you dont know which model to use id recomend using OpenRouter to easily switch between a bunch of models. I personally use openrouter/google/gemini-3-flash-preview.

## <Step 3: Start the gateway />

Run this command to install the daemon. This is a mini service that keeps OpenClaw running. This will also start OpenClaw and walk you through the onboarding

```bash
openclaw onboard --install-daemon
```

## <NOW FOR THE FUN PART! Lets make it useful! />

