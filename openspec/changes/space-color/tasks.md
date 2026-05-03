## 1. Database schema

- [ ] 1.1 Add `color String?` to the `Space` model in `packages/database/prisma/schema.prisma`
- [ ] 1.2 Run `bun run -F @dfs/database db:sync` to regenerate Prisma client and push schema

## 2. Domain — Space entity

- [ ] 2.1 Add `color: string | null` to `SpaceDto` interface
- [ ] 2.2 Add `color?: string | null` to `CreateSpaceParams` and `UpdateSpaceDetailsParams`
- [ ] 2.3 Add `color` field to `Space` class: constructor, `create()`, `fromDto()`, `toDto()`, `updateDetails()`
- [ ] 2.4 Update `space.entity.test.ts`: test create with/without color, update color, remove color, fromDto/toDto roundtrip

## 3. Application services

- [ ] 3.1 Add `color?: string | null` to `CreateSpaceInput` in `space-creator.service.ts`; pass to `Space.create()`
- [ ] 3.2 Add `color?: string | null` to `UpdateSpaceInput` in `space-updater.service.ts`; pass to `space.updateDetails()`
- [ ] 3.3 Update `space-creator.service.test.ts`: test create with color, create without color
- [ ] 3.4 Update `space-updater.service.test.ts`: test update color, remove color

## 4. Infrastructure — Prisma adapter

- [ ] 4.1 Update `space-prisma.repository.ts` to include `color` in the Prisma create/update calls and in the `toEntity` mapper
- [ ] 4.2 Update `space-in-memory.repository.ts` if needed (should work if it uses `fromDto()`/`toDto()`)

## 5. API router

- [ ] 5.1 Add `color: z.string().optional()` to the `create` and `update` input schemas in `spaces.router.ts`
- [ ] 5.2 Pass `color` through to the application service calls

## 6. Frontend — ColorPicker component

- [ ] 6.1 Create `apps/webapp/src/features/spaces/color-picker.tsx` with 4×4 preset grid + hex input
- [ ] 6.2 Create `apps/webapp/src/features/spaces/color-picker.test.tsx`: test selecting preset, deselecting, typing custom hex, sync between grid and input

## 7. Frontend — Admin forms

- [ ] 7.1 Add `ColorPicker` to `admin.spaces.new.tsx` with state `color: string | null`, pass to `createMutation.mutate()`
- [ ] 7.2 Add `ColorPicker` to `admin.spaces.$slug.edit.tsx`, initialize from space data, pass to `updateMutation.mutate()`
- [ ] 7.3 Add locale keys `admin:color`, `admin:colorPlaceholder`, `admin:noColor` to en/es/gl `admin.json`

## 8. Frontend — Visual display

- [ ] 8.1 In spaces list: add `border-l-4` with `style={{ borderLeftColor: space.color }}` when color is set
- [ ] 8.2 In space detail page: add colored dot next to the space name when color is set

## 9. Validation

- [ ] 9.1 Run `bun run lint:fix && bun run typecheck` from root
- [ ] 9.2 Run `bun test packages/ apps/api/` from root
- [ ] 9.3 Run `bun test` from `apps/webapp/`
