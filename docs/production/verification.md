# Проверка документации и проекта

Дата: **2026-10-19**. Проверено в текущем рабочем дереве; commit/release id не назначен.

| Команда | Результат |
| --- | --- |
| npm run docs:check | Успешно: 730 полей/props/API-членов, 37 registry types, 66 runtime-модулей, 6 валидных JSON-примеров |
| npm run lint | Успешно: ESLint без предупреждений; architecture audit — 130 source files и 15 JSON schemas |
| npm run typecheck | Успешно |
| npm test -- --maxWorkers=2 | Успешно: 393 теста в 33 файлах |
| npm run build | Успешно: TypeScript и Vite production build |

Vite сообщает advisory о chunk больше 500 kB: основной JS — 1 035,38 kB, gzip — 298,95 kB. Оптимизация bundle не входит в изменение документации.

Изменены справочные материалы, JSON-примеры и инструменты их проверки; runtime, backend и бизнес-компоненты не изменялись.

docs:check сопоставляет справку с текущими TypeScript declarations и registry, проверяет описания, локальные ссылки и примеры через существующие validators. Он не доказывает корректность каждого смыслового утверждения и не заменяет production security/performance review. Полные unit/integration tests проверяют текущую реализацию в пределах существующего набора.

Новый browser E2E прогон не выполнялся: это изменение документации, не UI. Успешная сборка не является подтверждением production-готовности; фактические границы описаны в [эксплуатации и ограничениях](production-operations.md).
