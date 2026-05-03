---
title: "An honest postmortem of my last side project"
description: "I shut down a project after eight months and 0 paying users. Here's what actually happened, with no comeback paragraph."
publishedAt: 2026-02-10
author: "Juan"
tags: ["personal", "business", "postmortem"]
---

I'm going to do the thing I've been telling other people to do.

In late 2024 I shut down a side project I'd been working on for eight months. It had 0 paying users at the end. Here's the honest version, in the format from [the postmortem template](/blog/the-postmortem-template).

## What I did

I built **Routine** — a tiny iOS app for designing morning and evening routines and getting gentle reminders to stick to them. Free with a $4/mo unlock for unlimited routines and cross-device sync.

I built it in SwiftUI, on weekends, between March and October 2024. I shipped to TestFlight in June. Public App Store launch in August. I posted about it on Twitter, on Indie Hackers, in a few subreddits where I thought it'd fit. I got around 180 downloads in the first month, dropping to maybe 30/month by October. Eight people started a paid trial. Zero converted. I shut it down in November.

Total time spent: I'd estimate around 280 hours of evening and weekend work.

## What I expected

I expected this to be a small, slow build but a real one. I'd been using a clunky version of the same idea (mostly notes and calendar reminders) for two years and had refined the mental model. I thought there was a real audience of "intentional productivity" people who'd happily pay $4/mo for a thing that was 30% nicer than the apps they were currently piecing together.

I expected first-year revenue around $300/mo by month 12. Not life-changing. Enough to cover the App Store fee, the domain, and feel like a sustainable little thing.

I expected conversion of maybe 8% from trial to paid, based on benchmarks I'd seen for similar productivity tools.

## What actually happened

The downloads were lower than I expected, and the conversion was 0% instead of 8%. Both numbers were off, but the conversion is the one that matters. People used the app. The eight trialers all opened it more than once. Three of them used it daily for two weeks. None of them paid.

I talked to four of the eight. The pattern was the same: **they liked the app, and they had no intention of paying for it.** Not because $4 was too much. Because the entire job — designing and tracking morning routines — was something they'd already mostly solved with free tools. They downloaded mine because the marketing made it sound nicer. Once they had it, "nicer" wasn't enough to overcome "I already have a thing that works."

This is the answer my market research couldn't get to, because market research mostly asks "would you use this?" and not "would you pay for this when the alternative is a free thing you already have?" Those are completely different questions, and I had the answer to the first one and not the second.

The other thing that happened: I stopped wanting to work on it. Around month seven, opening the project file became a chore. The bug list was the same length it had been for two months because I wasn't fixing things, just keeping notes. I kept telling myself I was just "tired" and the energy would come back after the launch hype. It didn't.

In retrospect, the stopping-wanting-to-work-on-it was earlier evidence than the conversion data. The body knew before the spreadsheet did.

## One thing I'd do differently

Before writing a single line of Swift, I'd post a one-page landing page describing the app and a $4/mo pre-order button. I'd send 50 people from the relevant subreddits to it. **The number of people who actually clicked "buy" before any product existed would have answered the only question that mattered.** Zero clicks would have saved me 280 hours.

I knew this technique. I read about it constantly. I didn't do it because I thought it was for "real businesses" and not for the small thing I was building, and because — let's be honest — I wanted the Swift practice and the satisfaction of building it more than I wanted to know whether to build it. The "MVP" was therapy disguised as a business.

## One thing I wouldn't change

I'd still ship the v1 in three months and put it in real users' hands. The shape of the product, the bugs that mattered, the friction points — I couldn't have figured any of that out from a roadmap. The build itself was correct; the problem was that the build itself shouldn't have happened until the demand question was answered.

The Swift practice also wasn't worthless. I learned a lot. If I treat the project as a paid education in iOS development at $0/hour, the "ROI" is fine. If I treat it as a business attempt, it failed.

## What I'm doing instead

Surbias, mostly. Surbias is a different shape of bet — there's no monetization assumption to validate, because the only revenue model is voluntary tips. The risk profile is "will anyone show up at all" rather than "will anyone pay." Different question, easier to answer with the same effort.

I have a folder of about 12 other Routine-shaped ideas I'd written down over the last two years. After this postmortem, I crossed off seven of them — they had the same "people already mostly solve this for free" problem. Five remain. Of the five, I picked one and have a landing page up. So far: two clicks on the buy button, both probably curious clicks rather than real intent. **Two is more useful information than 280 hours of building.**

That's it. No comeback. No clever turn. The project failed, the postmortem is written, the next thing is a slightly smarter test.

— Juan

Related: [The 10-minute postmortem template](/blog/the-postmortem-template), [What 50 dead startups taught me about advice](/blog/what-dead-startups-taught-me)
