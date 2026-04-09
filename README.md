# Cherry Chase

Static arcade game prepared for GitHub Pages.

## What is ready

- `index.html` is the public entry page.
- `config.js` lets the game connect to a shared Supabase scoreboard.
- If `config.js` is left empty, the leaderboard falls back to local browser storage.

## Publish to GitHub Pages

1. Create a new GitHub repository.
2. Upload everything from this `cherry-chase` folder to the repository root.
3. In GitHub: `Settings` -> `Pages`.
4. Set source to deploy from the main branch root.
5. Save and wait for the Pages URL.

## Make the scoreboard shared for everyone

1. Create a Supabase project.
2. Open the SQL editor and run `supabase-schema.sql`.
3. In Supabase project settings, copy:
   - Project URL
   - Anon public key
4. Put those values into `config.js`:

```js
window.CHERRY_CHASE_CONFIG = {
  scoreboard: {
    provider: "supabase",
    url: "https://YOUR_PROJECT.supabase.co",
    anonKey: "YOUR_ANON_KEY",
    table: "cherry_chase_scores"
  }
};
```

5. Commit the updated `config.js` to GitHub Pages.

After that, everyone using the same published link will see the same scoreboard.

## Important note

This machine currently does not have `git` installed, so the folder is prepared for GitHub Pages but has not been pushed automatically from here.
