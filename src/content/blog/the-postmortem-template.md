---
title: "The 10-minute postmortem template"
description: "A four-question template for writing about something that didn't work — short enough that you'll actually do it, structured enough that you'll learn something."
publishedAt: 2025-05-08
author: "Juan"
tags: ["writing", "templates"]
---

Most postmortem advice is too long. The official Google SRE template runs eleven pages. Nobody is going to fill that out for the side project that died last Tuesday.

Here's the version I actually use. It takes about ten minutes. It works for failed projects, failed jobs, failed relationships — anything where you want to write down what happened before you forget.

## The template

> 1. **What did you actually do?** (one paragraph, no judgment)
> 2. **What did you expect to happen?** (one paragraph)
> 3. **What actually happened?** (one paragraph)
> 4. **What's one thing you'd do differently — and one thing you wouldn't?**

That's it. Four questions. About a paragraph each.

The trick is the order. Most people start with "what went wrong" and that's where they get stuck — they want to assign blame, defend themselves, justify decisions. Starting with "what did I actually do" gets your hands on the keyboard before your judgment kicks in.

## Why no "lessons learned" section

You'll notice there's no slot for a tidy moral. That's on purpose. **Almost every premature lesson is either obvious or wrong.** "I should have validated demand earlier" — yes, you and everyone else. "I should have hired faster" — maybe, or maybe hiring fast would have killed you in a different way. Lessons need to soak. The honest postmortem is the one that just describes what happened and lets the lesson — if there is one — show up later, on its own.

If you really need to write something at the bottom, write what you'd do differently *for this specific scenario if you were dropped back into it tomorrow*. That's much more useful than a generic principle.

## Why the symmetric "wouldn't change" question

This is the part most postmortems skip and the part I think matters most.

When you only document what went wrong, you train yourself to attribute the whole outcome to error. But most failed efforts contain decisions that were good — that you'd make again — alongside decisions that were bad. Forcing yourself to name **one thing you wouldn't change** stops the slide into total self-criticism.

It also makes the postmortem more useful when you read it later. "I'd talk to users sooner, but I'd build the same product" is a much sharper sentence than "I screwed up, the end."

## A worked example

Here's one I wrote for a side project I shut down in late 2024.

> **What I did:** I built a paid newsletter aggregator for finance content. I gathered 12 paid subscriptions, deduplicated, summarized with an LLM, and emailed the digest daily. I worked on it nights and weekends for about four months. I had 30 paid subscribers at peak.
>
> **What I expected:** I expected most subscribers would stay because reading 12 newsletters is genuinely a pain, and a $9/mo digest is a no-brainer for someone already spending hundreds on the originals. I expected churn around 5% monthly.
>
> **What happened:** Churn was closer to 30% monthly. People loved the product for two weeks then unsubscribed. Talking to churners, the pattern was: the digest was good, but it removed the reason they were subscribed to the originals (which was mostly identity and FOMO, not information). They didn't want my better thing; they wanted to feel like the kind of person who reads the original. I'd misread the entire job-to-be-done.
>
> **One thing I'd change:** I'd interview five paying subscribers of the originals before building anything, asking them why they keep subscribing — not "would you use a digest." The answer would have been obvious.
>
> **One thing I wouldn't change:** I'd still ship a v1 in two weeks before building any infrastructure. The shape of the thing only became visible once it was running, and I'd have spent six months on the wrong abstraction otherwise.

That whole thing took fifteen minutes to write. It's more useful than any framework.

## How to use this on Surbias

If you've been sitting on a story you keep not posting, fill in the four questions. Then strip the structure off and post the result as a paragraph or two. The template is scaffolding for your thinking, not for the reader. Once it's done its job, take it out and let the story stand on its own.

The point isn't to publish a polished retrospective. It's to write fast enough that you do it before the story rots in your head, and structured enough that you learn something on the way out.

— Juan
