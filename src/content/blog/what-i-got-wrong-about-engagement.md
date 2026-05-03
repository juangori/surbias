---
title: "What I got wrong about engagement"
description: "I built Surbias with anti-engagement principles. A year in, I had to admit some of my engagement-skepticism was just laziness wearing a moral costume."
publishedAt: 2026-03-25
author: "Juan"
tags: ["product", "design", "meta"]
---

I'm going to push back on something I've written here before.

In several earlier posts, I talked about Surbias as an "anti-engagement" platform. No likes. No follower counts. No leaderboard. The framing was: engagement metrics warp behavior, so we don't have them.

I still believe most of that. But about a year in, I had to admit a quieter truth: **some of my anti-engagement positions weren't principled; they were just easier than building things.**

Here's what I got wrong.

## Wrong: "We don't need notifications"

For the first eight months, Surbias had no notifications of any kind. If someone reacted to your post, you'd find out only by coming back and looking. I told myself this was deliberate — a defense against the dopamine loop, a refusal to compete on attention.

It was also free. Building notifications is work. Email notifications are *especially* work, because they involve picking a provider, verifying a domain, designing templates, building unsubscribe flows.

So when people kept asking "how do I know if someone responded to my story?" and I said "we don't do notifications, by design" — I was conflating "we don't do them" with "we shouldn't do them."

The honest answer was: we should, I haven't built it.

I shipped notifications eventually. They are a small bell in the navigation that lights up when something happens on a story you wrote. They are explicitly not push notifications, and the email digest is opt-in. It works. **People come back more, and the comeback isn't bad — it's the kind of return that produces follow-up posts**, not the kind that produces compulsive scrolling.

The principle I thought I was protecting wasn't being protected by the absence of notifications. It was being protected by the *shape* of notifications I'd build. The choice was never binary.

## Wrong: "We don't need a feed algorithm"

Same shape of mistake. For most of year one, the feed was strict reverse-chronological. New post on top, old post on bottom. I called this "honest" and "anti-manipulation."

It was also lazy. Strict chronological is the default that a database query gives you. It is not a designed system. It treats the recency of a post as the only signal that matters, which is a strong claim and one I never actually defended.

The cost: posts that resonated with readers got two days at the top of the feed and then disappeared forever. People who showed up on a Tuesday saw nothing of what hit on a Sunday. Stories with real long-tail value were structurally hidden after 48 hours.

The fix wasn't an engagement-optimizing algorithm. It was something boring: a "hot" sort option (last 7 days, ranked by reactions) and a "popular" sort (all-time, ranked by reactions). Both are still available alongside chronological. Both are honest in a way I think is fine — the user picks which lens they want.

Adding the "hot" view didn't ruin the platform. It just meant good posts could be found by people who showed up after the post was no longer new. That's not engagement-warping. That's just doing the job a feed is supposed to do.

## Wrong: "We don't need any kind of user identity surface"

I was very stuck on "no profiles, ever." A profile, I argued, becomes a stage. A stage encourages performance. Performance kills honesty.

The slightly more nuanced truth I arrived at later: **the question isn't whether there's a profile, it's what's on it.**

A profile that shows your follower count and a portfolio of "best posts" — yes, that's a stage. But a profile that shows nothing public, just a place for *you* to see your own posts and comments and bookmarks — that's a private dashboard, not a stage. There's no audience, so there's nothing to perform for.

I built the dashboard version eventually. There's no public-facing user page. Nobody sees your post history. But you can see your own. You can see what you've bookmarked. You can manage your notification preferences. Nobody else can see any of this.

The principle I was trying to protect was preserved. The thing I was avoiding — building any user surface at all — turned out to be over-cautious.

## The pattern

I'm noticing a pattern in these mistakes. Each one was a place where I'd taken a real principle ("engagement metrics warp behavior") and used it to skip a piece of product work that would have required nuance. The principle let me stop thinking. "Anti-engagement" became a reason not to ask "what specifically is this notification doing? what specifically is this profile showing?"

Real anti-engagement work isn't refusing to build things. It's building the things people actually need in shapes that *don't* turn into status games. It's harder than absence. The absence version felt principled because it didn't require me to do the harder work of designing features that pull their weight without warping the product.

## What I still think is right

The original convictions still stand:

- No public follower counts. Still right.
- No public profiles. Still right.
- No likes. Still right (the five empathetic reactions are doing the job — see [the post on this](/blog/seven-reactions-not-likes)).
- No "people you may know" or recommendation graph for users. Still right.

But "no notifications," "no algorithmic surfaces," "no user surfaces of any kind" — those were positions I was holding partly out of laziness, dressed up in the language of principle. The product is better for me having admitted that, and the principles I actually care about are stronger for being stated more precisely.

It's good practice to occasionally check whether the things you "won't do, on principle" are actually principles or just things you haven't gotten around to. The two are easier to confuse than I'd like.

— Juan

Related: [Why we don't have likes (and what we have instead)](/blog/seven-reactions-not-likes), [The case against follower counts](/blog/the-case-against-followers)
