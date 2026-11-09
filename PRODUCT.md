# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

GitHub users, GitHub administrators, and potentially technical decision makers evaluating developer tools. They are usually novice to intermediate in GitHub and GitHub Copilot and want to understand how the products work.

## Product Purpose

Glassbox helps people understand GitHub, GitHub Copilot, cloud, AI, and developer-tooling concepts through concise explanations paired with interactive diagrams that show how the parts fit together.

## Positioning

Glassbox pairs short, focused wiki pages with interactive diagrams that make relationships and flows visible, rather than relying on prose alone.

## Operating Context

Readers browse a static wiki of topic pages. Each topic is a short MDX page and may include focused interactive diagram islands. The site is built with Astro and Svelte and deployed to GitHub Pages.

## Capabilities and Constraints

- Each page explains one idea at a time and stays within the requested topic's scope.
- Product claims are verified against official GitHub or Microsoft documentation.
- Use one concrete example and note important variations without building exhaustive settings or permissions matrices.
- Cover GitHub.com and Enterprise Cloud; mention Enterprise Server only when a difference is essential.
- Additional product-specific accessibility standards and brand commitments were not confirmed during init and remain open.

## Evidence on Hand

- Existing topic pages and interactive diagrams under `src/content/topics/` and `src/components/`.
- Copilot administration workshop materials in `docs/copilot-admin-foundations-runbook.md` and `docs/copilot-admin-foundations-cheatsheet.md`.

## Product Principles

- Make complex product relationships easier to understand.
- Keep explanations concise and focused on one idea.
- Ground product claims in official documentation.
- Use diagrams to clarify how parts connect, not as decoration.
