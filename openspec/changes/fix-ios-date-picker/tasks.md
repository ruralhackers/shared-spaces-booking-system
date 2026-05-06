## 1. Fix availability-finder.tsx

- [x] 1.1 In `handleOtherPreset`, initialise `chosenDate` to `localDateString(now, tz)` instead of `""`
- [x] 1.2 Replace the raw `<input type="date">` with the shadcn `<Input>` component (add import if needed)

## 2. Validation

- [x] 2.1 Run `bun run lint:fix && bun run typecheck && bun test` — all must pass
- [ ] 2.2 Deploy: `ssh root@salas.espacioarroelo.es "bash /root/deploy-shared-spaces.sh"`
