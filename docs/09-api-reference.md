# API Reference — VNext Endpoints

All endpoints require authentication. Role-restricted endpoints require `requireRole()`.

## Methodology & Profiles
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/methodology/profiles | Auth | List all methodology profiles |
| GET | /api/methodology/profiles/:key | Auth | Get specific profile |
| GET | /api/methodology/sector-families | Auth | List 8 sector families |
| GET | /api/methodology/project-types | Auth | List all project types with families |
| GET | /api/methodology/instruments | Auth | List 7 instrument types with signals |
| GET | /api/methodology/layered-scoring | Auth | Layered scoring architecture spec |
| GET | /api/methodology/evidence | Auth | List methodology evidence |
| POST | /api/methodology/evidence | Admin | Add methodology evidence |

## Calibration & Memos
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/calibration/memos | Auth | List generated memos |
| POST | /api/calibration/memos/generate | IO/Admin | Generate new memo |
| GET | /api/calibration/memos/:id | Auth | Get specific memo |

## Validation & Overrides
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/validation/cases | Auth | List validation cases |
| POST | /api/validation/cases | IO/Admin | Create validation case |
| GET | /api/validation/cases/:id/observations | Auth | List observations |
| POST | /api/validation/cases/:id/observations | IO/Admin | Add observation |
| GET | /api/overrides | Auth | List override decisions |
| POST | /api/overrides | Admin | Record override |

## Outcomes & Disbursement
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/projects/:id/outcomes | Auth | Full outcome data |
| POST | /api/projects/:id/outcomes | IO/Admin | Create/update outcomes |
| POST | /api/projects/:id/metrics | IO/Admin | Add outcome metric |
| PATCH | /api/metrics/:id | IO/Admin | Update metric progress |
| POST | /api/projects/:id/milestones | IO/Admin | Add disbursement milestone |
| PATCH | /api/milestones/:id | IO/Admin | Update milestone status |
| POST | /api/projects/:id/transitions | IO/Admin | Add transition pathway |

## ESL Services
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/esl-services/catalog | Auth | Full 16-service catalog |
| POST | /api/esl-services/recommend | Auth | Smart service recommendations |

## Enhanced Project Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/projects/:id/pers-assessment | Auth | Full layered PERS assessment |
| POST | /api/projects | IO/Admin | Create project (now includes layered scoring) |

## Notes
- IO = Investment Officer
- All POST/PATCH endpoints accept JSON body
- PERS assessment now returns layered breakdown with explainability
