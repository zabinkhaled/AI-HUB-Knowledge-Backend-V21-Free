# POST /api/knowledge/query

Request:
```json
{"question":"How do I repair my phone?","language":"auto","mode":"all","sources":["web","youtube","official_docs","images"]}
```

Response contains:
- `answer`
- `steps`
- `teachingPoints`
- `actions`
- `caveats`
- `citations[]` bound to returned source IDs
- `sources[]` with verification metadata
- `connectorStatus[]`
- `verification` counts
- `aiStatus`
- `engineVersion`

The frontend should render citations from `citations[]`, not manufacture links.
