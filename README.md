# FitTrack (React + Vite)
1. Extract into your `fittrack` folder
2. `npm install`
3. `npm run dev`  (open the URL shown)
Build: `npm run build`. Deploy to Vercel with default Vite settings.
Data is stored in the browser (localStorage) and does not sync across devices. Use Data > Export JSON to back up.

## Calorie estimator
All maths is in `src/utils/calorieCalculator.js` (tests: `npm test`).
- **Validated base formula:** kcal/min = MET x 3.5 x body weight (kg) / 200. MET values come from `src/exercises.js`.
- **Strength:** active time = completed reps x seconds per rep (default 3 s, overrides in `SEC_PER_REP`); no workout duration needed. Rest is not counted.
- **Heuristic load factor (not scientifically validated):** multiplies each set by 0.85-1.30 using relative intensity (1RM if known, otherwise reps + optional RPE) and load relative to body weight. Tune `FACTOR_MIN/MAX`, `BW_FRACTION`, `DEFAULT_SEC_PER_REP`.
- **Bodyweight (BW):** body weight x 0.65 is treated as moved load, plus optional added weight.
- **Timed holds** (planks, wall sit, dead hang): MET x seconds. **Cardio/sports:** MET x minutes x intensity.
- **Weights** are stored in kg and displayed in kg or lb. Dumbbell exercises ask whether the entry is per dumbbell or combined.
- Each saved record stores body weight, MET, model version and the estimate, so past results never change when body weight changes. Editing a record replaces it (no double counting).
- Results are estimates, not measured calories. Training volume is shown separately and is not energy.
Run locally: `npm install`, `npm run dev`. Tests: `npm test`. Build: `npm run build`.
