---
title: "The first 100 stories — patterns I didn't expect"
description: "What the first hundred posts on Surbias actually looked like — what categories filled up first, which reactions people used most, and the thing I got completely wrong."
publishedAt: 2025-03-25
author: "Juan"
tags: ["data", "patterns", "meta"]
---

I was wrong about almost everything.

Before launch, I wrote down predictions about what the first 100 stories on Surbias would look like. I was so confident I sealed them in a note and dated it. Then last week I checked the database against my predictions. The score: 3 out of 11.

This is what I got wrong.

## Prediction 1: most stories would be about business

I assumed the early audience would be founders. They'd be the loudest. They'd be the ones who already knew about survivorship bias and wanted somewhere to vent. I expected business and career to make up 60% of posts combined.

What actually happened: **relationships was the biggest category**. By a lot. Career was second. Business was a distant fourth, behind health.

Looking back, this is obvious. People who post about failed businesses already have outlets — Indie Hackers, Hacker News, twenty newsletters about startup post-mortems. People who want to talk about a friendship that quietly ended? There's nowhere good for that. So they came here.

## Prediction 2: "respect" would be the most-used reaction

Of the five reactions ("me too," "hug," "strength," "respect," "solidarity"), I thought "respect" would dominate. It's the most flattering. It tells the writer they did something brave by sharing.

I was off by a mile. **"Me too" is used roughly 4× more than any other reaction.** That tells me something I didn't understand before: the dominant emotion when reading a vulnerable story isn't admiration. It's recognition. People aren't here to applaud. They're here to feel less alone.

I think this also explains why the platform feels different from anywhere else — recognition is a quieter signal than applause, and quiet signals don't reward performance the same way.

## Prediction 3: most posts would be short

I built the textarea with a 5000-character cap and assumed people would write 200–400 character posts, like tweets but sad. I sized the body preview to 250 chars expecting that to cover most of a post.

The actual median post length is around 800 characters. The longest is 4,800. **The instinct to write more, not less, is strong** — once people decide to share, they don't half-share. They go.

I changed the preview clamp to 220 chars after seeing this. Better to under-show and pull people into the full post than to spoil the whole thing in a card.

## Prediction 4: anonymous would be the default and stay that way

This one I got right. **Roughly 92% of posts are anonymous.** The fraction held steady from the first ten posts to the hundredth. There's no slow drift toward identification, no trickle of brave souls attaching their names. People came for anonymity and they stayed for it.

This might be the single most important data point. It tells me the product's central design choice is correct, and I shouldn't get cute and try to push attribution later.

## Prediction 5: comments would barely happen

Wrong, but not in the way I expected.

I thought there'd be very few comments because people don't comment on posts that don't ask for comments. Failure stories don't end with a question. There's no hook.

What actually happens: **maybe one in eight posts gets a comment, but the comments themselves are surprisingly long and surprisingly good.** Average comment length is over 200 characters. They're almost always either "this happened to me too" with details, or "thank you for writing this" with details about why. There are almost no troll comments. There are zero "first!" comments.

I think this is because the only people who scroll deep enough to comment are the people the post hit hard. The shallow audience bounces. The depth audience stays.

## Prediction 6: people would post once and never come back

This was my pessimistic baseline. I assumed the mechanism was: get something off your chest, leave, never return. Surbias as a one-shot purgatory.

Wrong by half. **About 35% of posters come back to post a second story.** And of the ones that come back twice, more than half come back a third time. There's a small group of repeat posters who are using Surbias the way other people use journals — except their journal is read by strangers who occasionally write back.

This changes my whole mental model of the product. It's not just an outlet. For some people, it's an ongoing conversation with the version of themselves that needs to keep telling the truth.

## What I got right

- **People don't want a "happy ending" prompt.** Nobody asked for one. The original homepage tagline ("No happy ending needed") seems to be doing the load-bearing work of giving people permission to leave a story unresolved.
- **The five reactions, not three.** Early on I considered cutting it down to "me too / hug / respect" — three options, simpler. I kept five and I'm glad. The long tail of "strength" and "solidarity" carries posts that need a more specific kind of response.
- **No comment threading.** I considered nesting replies. I left it flat on purpose. After 100 posts, I haven't seen a single conversation that needed a tree to make sense.

## What I'd tell myself before launch

Trust the people who show up.

I had a list of features I was going to add "if engagement isn't there." Most of them were optimization for a problem that didn't exist. The first 100 stories told me the product I built was closer to right than I expected, and the parts that were wrong were wrong in directions I couldn't have predicted from outside.

I'm leaving most of those features unbuilt.

— Juan
