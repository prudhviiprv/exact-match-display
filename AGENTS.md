<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# AGENTS.md

- UI never generates data itself: demo data lives in `src/data/` (seeded, async service) and the live sim in `src/hooks/use-simulation.ts`, so a real CV/backend API can replace them without UI changes.
- All shared types live in `src/types/traffic.ts`; keep mock services and real services conforming to them.
- Dark technical sections use the `.dark` class on a wrapper (not a global theme toggle) to mix light editorial and dark surfaces.
