# Versioned Google Forms Intake Plan

## Document Status

- Status: planning
- Target branch: `nuevo-googleform`
- Scope: coexistence of the current adoption form and a new adoption form
- Existing related document: `PLAN.md` belongs to the Mercado Pago integration and must not be modified by this work
- Implementation rule: the legacy intake route must remain operational until the organization confirms that the old Google Form is no longer used

## 1. Objective

Support the new Google Form while preserving compatibility with submissions from the existing form.

The two forms are similar but are not the same input contract. Several questions were rewritten, some questions were removed, the food questions were combined, the employment and vacation questions were shortened, and email-related fields were added. The new form also contains a responsible-ownership-law question whose response must be visible to the human evaluator.

The implementation must avoid mixing the two contracts in one large map or one ambiguous evaluation prompt. The migration must be reversible and must not require a Firestore data migration for existing documents.

## 2. Current System

### 2.1 Current intake route

The existing route is:

```text
/api/google-forms
```

Source file:

```text
src/app/api/google-forms/route.tsx
```

The route currently performs these operations:

1. Reads the bearer token from the `Authorization` header.
2. Compares the token with `GOOGLE_FORMS_API_SECRET`.
3. Reads a JSON object whose keys are Google Forms question labels.
4. Normalizes whitespace in each question label.
5. Uses `FIELD_MAP` to convert question labels into canonical Firestore field names.
6. Stores the normalized fields and the original normalized question labels in `rawData`.
7. Creates a document in the `googleForms` collection.
8. Starts the AI evaluation.
9. Returns the evaluation when it finishes within the timeout.
10. Leaves the document without an evaluation when the timeout is exceeded.

### 2.2 Current evaluation pipeline

The evaluation pipeline is implemented in:

```text
src/lib/evaluation/shared.ts
```

It currently has:

- One Google AI evaluation prompt.
- One Groq fallback prompt.
- A common `runFullEvaluation` function.
- A common output shape containing score, strengths, concerns, missing information, summary, recommendation and preferences.

### 2.3 Current retry behavior

Manual evaluation retries are implemented in:

```text
src/lib/evaluation/actions.ts
```

The retry action receives the form data from the client, removes metadata fields, prepares the evaluation data and calls `runFullEvaluation`.

The retry flow currently does not know which version of the form produced the document. It must become version-aware so a legacy form is never reevaluated with the new-form prompt.

### 2.4 Current administrative interface

The main administrative pages are:

```text
src/app/plam-admin/formularios/FormulariosPageContent.tsx
src/app/plam-admin/formularios/[id]/FormularioDetailContent.tsx
```

Both pages:

- Read the shared `googleForms` collection.
- Treat records without a status as `pending`.
- Allow a human evaluator to change the status to `reviewing`, `approved` or `rejected`.
- Use `FIELD_LABELS` to display normalized answers.
- Allow PDF generation through `downloadFormPdf`.

The current status workflow is human-controlled. The AI recommendation does not automatically change the Firestore status.

### 2.5 Current presentation-order issue

The current interface and PDF use the global `FIELD_LABELS` object. They do not use the insertion order of `rawData` as a formal presentation contract.

`rawData` is useful for preserving the received question labels, but a Firestore map must not be treated as the authoritative order of questions. The new form therefore needs an explicit ordered presentation definition.

## 3. Confirmed Product Decisions

### 3.1 Separate routes

Keep the existing route for the old form and create a versioned route for the new form.

Legacy route:

```text
/api/google-forms
```

New route:

```text
/api/google-forms/v2
```

The new Google Apps Script must send requests to `/api/google-forms/v2`.

### 3.2 Shared Firestore collection

Both routes must write to:

```text
googleForms
```

Using one collection keeps the existing administrative pages, comments, status updates, PDF generation and animal-assignment workflow compatible with both form versions.

Creating a second collection would require duplicating or redesigning the administration interface and would make future applicant profiles harder to build.

### 3.3 Independent question maps

The legacy `FIELD_MAP` must remain dedicated to the old form.

The new route must use a separate `FIELD_MAP_V2` containing only the new form question labels.

The two maps must not be merged into one large object.

### 3.4 Independent evaluation profiles

The legacy form keeps its current evaluation criteria.

The new form receives a new evaluation profile adapted to the questions that it actually contains.

Each evaluation profile may have two provider prompts:

- A Google AI prompt.
- A Groq fallback prompt.

The implementation must not remove legacy criteria from the legacy prompt while the old form is still supported.

### 3.5 Human-controlled status

Every received form remains in the human evaluation workflow:

1. The route accepts and stores the submission.
2. The record enters the system as `pending`.
3. The AI produces an evaluation when possible.
4. The human evaluator reviews the evaluation and any alerts.
5. The human evaluator changes the status manually.

The responsible-ownership-law response must not:

- Block the HTTP request.
- Prevent Firestore persistence.
- Automatically set the status to `rejected`.
- Automatically set the status to `approved`.
- Prevent the evaluator from making the final decision.

## 4. Non-Goals

This phase must not implement:

- Applicant profile documents.
- Automatic matching between multiple forms.
- Automatic association with an adopted animal.
- Automatic applicant deduplication.
- A new applicant collection.
- Automatic rejection based on any AI output.
- Automatic approval based on any AI output.
- Removal of the legacy route.
- Removal of the legacy evaluation prompt.
- A separate administration page for the new form.
- A backend status gate that prevents a human evaluator from choosing a status.

The email fields are stored now to support a later applicant-profile phase. Their use as identifiers is intentionally deferred.

## 5. Data Model

### 5.1 Form version

Add a version field to `GoogleFormEntry`:

```text
formVersion?: 'legacy' | 'v2'
```

The field must be optional because existing documents do not contain it.

Interpretation rules:

- `formVersion === 'v2'`: use the new-form map, labels, order and evaluation profile.
- `formVersion === 'legacy'`: use the legacy map, labels, order and evaluation profile.
- Missing `formVersion`: treat as `legacy`.

New submissions received through the legacy route should preferably store `formVersion: 'legacy'` without changing their behavior.

New submissions received through the v2 route must store `formVersion: 'v2'`.

### 5.2 Email fields

Add two separate optional fields:

```text
applicantEmail?: string
googleAccountEmail?: string
```

The source mapping is:

| Source question | Canonical field |
|---|---|
| `Mail` | `applicantEmail` |
| `Dirección de correo electrónico` | `googleAccountEmail` |

Both values must be stored independently. Mapping both values to one field would allow one value to overwrite the other and would make future comparison impossible.

The canonical fields should be trimmed and lowercased at ingestion. The original values remain available inside `rawData`.

Do not compare the values in this phase.

Do not create an applicant profile in this phase.

Do not treat different domains as invalid. An applicant may enter an `@icloud.com` address while Google Forms reports a different address associated with the Google account.

Both email fields must be excluded from AI evaluation data.

### 5.3 Responsible ownership response

Add the following field:

```text
responsibleOwnershipAgreement?: string
```

This field must remain separate from `neuteringOpinion` because the new form contains both a castration question and a separate responsible-ownership-law question.

Expected answers are:

- `Estoy de acuerdo`
- `No estoy de acuerdo`
- `Otro`

If the `Otro` response contains additional text, preserve the complete answer.

The answer must remain part of the v2 evaluation input.

## 6. New Form Question Mapping

The v2 route must normalize the new form question labels into the existing canonical field vocabulary whenever possible.

| New form question or description | Canonical field | Handling |
|---|---|---|
| `Marca temporal` | `submittedAt` | Preserve as submission metadata |
| `Nombre y apellido` | `fullName` | Reuse existing field |
| `Teléfonos de contacto:` | `phone` | Reuse existing field |
| `Nombre o descripción de la mascota elegida...` | `selectedPet` | Reuse existing field |
| `Domicilio detallado (calle, número) y Localidad:` | `address` | New wording, same semantic field |
| `Mail` | `applicantEmail` | Applicant-entered email |
| `¿Qué edad tiene usted?` | `age` | Reuse existing field |
| `¿Trabaja actualmente?` | `employmentStatus` | New question contains less detail than the legacy field |
| `¿Ha pensado qué hará con su perro cuando se tome vacaciones?` | `vacationPlan` | New wording |
| `¿Qué otras personas habitan en su casa?...` | `householdMembers` | Reuse existing field |
| `Tipo de vivienda (apto, casa,...):` | `housingType` | New punctuation |
| Patio security question | `yardSecurity` | Reuse existing field |
| Neighbor question | `neighborIssues` | Reuse existing field |
| `¿Vivienda propia o de alquiler?` | `housingOwnership` | Reuse existing field |
| Combined food and brand question | `petDiet` | Store the complete answer |
| Castration opinion question | `neuteringOpinion` | Reuse existing field |
| Adoption motivation question | `adoptionReason` | Reuse existing field |
| Family agreement question | `familyAgreement` | New wording |
| Sleeping location question | `sleepLocation` | Reuse existing field |
| Previous animals question | `petExperience` | Reuse existing field |
| Other animals question | `otherPets` | Reuse existing field |
| Time-alone question | `hoursAlone` | New wording |
| Off-leash question | `offLeashPlan` | Reuse existing field |
| Shortened tied-dog question | `chainingOpinion` | The new response does not include the legacy duration wording |
| Behavior problem question | `behaviorResponse` | Reuse existing field |
| Identification commitment question | `identificationCommitment` | Reuse existing field |
| Expanded vaccination question | `annualVaccination` | New wording |
| Responsible-ownership-law question | `responsibleOwnershipAgreement` | Must remain visible to the evaluator |
| `Dirección de correo electrónico` | `googleAccountEmail` | Google-collected email |

The following legacy fields are not present in the new form and must remain in the type for old records but must not be expected by the v2 evaluator:

- `petNeeds`
- `foodBrands` as a separate response
- `alternativePetInterest`
- `selectionCriteria`
- `growthTolerance`
- `lifespanKnowledge`
- `workSchedule`
- `contactSource`
- `sizePreference`

The informational adoption-responsibility paragraph that explicitly says no response is required must not be treated as an evaluation answer. If Google Sheets sends it as a key, preserve it in `rawData` but do not map it to a canonical field.

The responsible-ownership-law question is different: it has a response and must be mapped and evaluated.

## 7. Combined Food Response

The legacy form had separate food-related answers:

- The food considered appropriate for the animal.
- Brands currently used or considered appropriate.

The new form combines these concepts into one answer.

The complete v2 answer must be stored in:

```text
petDiet
```

The v2 route must not attempt to split free text into `petDiet` and `foodBrands`. Automatic splitting would be unreliable and could lose context.

The v2 prompt must explicitly explain that `petDiet` may contain both feeding habits and brand names.

The existing brand criteria remain applicable. For example, the evaluator must still recognize a response such as:

```text
Le daria comida variada, a veces comida natural y otras veces racion. La marca que conozco es Maxine.
```

The evaluator must assess both:

- The proposed diet.
- The quality category of the mentioned brand.

The legacy `foodBrands` field remains available for legacy records and legacy evaluation.

## 8. Evaluation Profiles

### 8.1 Profile names

Introduce a validated evaluation profile identifier:

```text
legacy | v2
```

`runFullEvaluation` should receive the profile explicitly, with `legacy` as the safe default for existing callers.

Conceptual signature:

```text
runFullEvaluation(docId, evaluationData, profile)
```

The exact implementation may use a profile configuration object instead of a string parameter, but the selection must be explicit and type-safe.

### 8.2 Legacy profile

The legacy profile must preserve the current Google AI and Groq prompts.

It must continue evaluating the criteria associated with the old form, including fields that are absent from the new form.

It must remain available after the legacy intake route is retired so historical records can still be reevaluated.

### 8.3 V2 profile

The v2 profile must have its own Google AI prompt and Groq fallback prompt.

The v2 prompts must:

- Evaluate only criteria represented by the new form.
- Not report intentionally omitted legacy questions as missing information.
- Keep the combined food and brand analysis in `petDiet`.
- Evaluate `responsibleOwnershipAgreement`.
- Recognize that the new tied-dog question does not ask for duration.
- Recognize that the new employment question does not provide profession or free-time information.
- Recognize that the expanded vaccination text maps to `annualVaccination`.
- Avoid penalizing the absence of `sizePreference`.
- Use `cualquiera` for size when no reliable size preference can be inferred.

The v2 prompt must not include missing-information penalties for:

- `petNeeds`
- Separate `foodBrands`
- `alternativePetInterest`
- `selectionCriteria`
- `growthTolerance`
- `lifespanKnowledge`
- `workSchedule`
- `contactSource`
- `sizePreference`

The v2 prompt may still identify ambiguity in an answer that the new form actually asks for. It must distinguish between an unanswered current question and a question that the form version intentionally does not contain.

### 8.4 Evaluation data exclusions

The following fields must not be sent to either AI provider:

- `fullName`
- `phone`
- `applicantEmail`
- `googleAccountEmail`
- `submittedAt`
- `contactSource`
- `selectedPet` when it is treated as administrative/personal data by the existing policy
- `rawData`
- `createdAt`
- `evaluation`
- `status`
- `formVersion`
- `approvedAnimalId`
- `approvedAnimalName`

The responsible-ownership answer must not be excluded because it is an adoption-relevant criterion.

### 8.5 Retry behavior

Manual evaluation retries must select the profile from `formVersion`.

Rules:

- `formVersion === 'v2'` uses the v2 profile.
- `formVersion === 'legacy'` uses the legacy profile.
- Missing `formVersion` uses the legacy profile.
- Invalid version values use the legacy profile and produce a warning log without exposing form data.

Retrying a v2 form must not accidentally reintroduce missing-information penalties from the legacy prompt.

Retrying a legacy form must not use the v2 prompt merely because the new route exists.

## 9. Responsible Ownership Alert

### 9.1 Business behavior

The response to the responsible-ownership-law question is an important human-review signal.

The organization does not want the system to reject the form automatically. The form must be stored and remain `pending` so the human evaluator can make the final decision.

The AI evaluation and the administrative alert are complementary:

- The AI includes the response in its reasoning and `concerns`.
- The administrative interface displays a prominent alert independently of the AI score.
- The status remains controlled by the human evaluator.

### 9.2 Alert categories

Normalize the answer only for classification. Preserve the original answer in the stored field and in `rawData`.

| Answer | Alert | Status behavior |
|---|---|---|
| `Estoy de acuerdo` | No alert | Remains `pending` until human review |
| `No estoy de acuerdo` | Prominent red alert | No automatic rejection; human decides |
| `Otro` or `Otro: ...` | Prominent amber alert | No automatic rejection; human decides |
| Empty, unexpected or unrecognized | Review alert | No automatic rejection; human decides |

Suggested red alert text:

```text
The applicant does not agree with the responsible-ownership and sterilization requirements. Do not assign an animal without human review of this response.
```

Suggested amber alert text:

```text
The applicant selected an alternative answer regarding responsible ownership. Review the complete response before making a decision.
```

The alert is a decision aid, not a technical status gate. The system must not mutate `status` based on this field.

### 9.3 Alert implementation

Create one shared classification helper so the list page and detail page do not implement slightly different comparisons.

The helper should:

- Trim whitespace.
- Compare case-insensitively.
- Recognize `Otro` values that include additional text.
- Return a stable alert category.
- Return no alert for an explicit `Estoy de acuerdo` response.
- Return a review alert for missing or unknown responses.

The alert should appear:

- In the form list/card view.
- In the form detail view.
- Near the evaluation summary or status controls.

The alert should remain visible after the evaluator changes the status so the recorded decision retains its context.

## 10. Ordered Presentation Model

### 10.1 Presentation definitions

Do not use the order of `rawData` or the order of Firestore map keys as the presentation order.

Create explicit definitions for each version. Each item should contain at least:

```text
field
label
```

The definitions should preserve the actual order of the corresponding Google Form.

Conceptual structure:

```text
LEGACY_FORM_FIELDS
NEW_FORM_FIELDS
```

The new definition must include:

- `applicantEmail` at the position of `Mail`.
- `googleAccountEmail` at the position of the Google-collected email.
- `responsibleOwnershipAgreement` at the position of the law question.
- `petDiet` once, at the position of the combined food question.

The legacy definition must preserve the current form order and labels.

### 10.2 Rendering behavior

The panel and PDF should:

1. Resolve the form version.
2. Select the matching ordered definition.
3. Iterate through fields in that definition.
4. Read the value from the canonical document field.
5. Display the corresponding version-specific label.
6. Skip empty canonical fields unless the interface explicitly wants to show unanswered questions.

This ensures that the new form uses its own wording and order while the legacy form remains unchanged.

### 10.3 Raw data behavior

Keep `rawData` for:

- Auditability.
- Troubleshooting AppScript payloads.
- Future migrations.
- Preserving question labels that do not have canonical fields.

Do not use `rawData` as the primary ordering mechanism.

If a response exists in `rawData` but is not represented by a presentation definition, append it in a clearly separated raw-only section after the ordered canonical fields. The information-only adoption paragraph may be omitted from the normal response display when it has no answer.

### 10.4 Existing implementation implications

The current `FormularioDetailContent` and `FormulariosPageContent` calculate `rawAnswers`, but the visible response list is driven by `FIELD_LABELS`. The implementation must replace this global-only behavior with the version-aware presentation definitions.

`generateFormPdf.ts` must use the same version-aware definitions as the administration interface so the on-screen form and the PDF have consistent ordering and labels.

## 11. Administration Interface Changes

### 11.1 Type and labels

Update `GoogleFormEntry` with:

- `formVersion`
- `applicantEmail`
- `googleAccountEmail`
- `responsibleOwnershipAgreement`

Add the new fields to the v2 presentation definitions.

Do not remove legacy labels or legacy fields.

### 11.2 Form version indicator

Show a small non-blocking version indicator so evaluators know that scores may have been generated using different evaluation criteria.

Suggested labels:

- `Formulario anterior`
- `Formulario nuevo`

The version indicator is informational only.

### 11.3 Status controls

Do not change the existing human-controlled status workflow.

The approval controls remain available. The responsible-ownership alert must appear before or next to the controls so the evaluator sees it before choosing a status.

The application must not silently change the status when the alert is generated.

### 11.4 Email display

Display the two email fields in the v2 response section using their respective labels.

Do not add matching, history or applicant-profile behavior in this phase.

## 12. Files and Responsibilities

### 12.1 API and schemas

Expected files:

- `src/app/api/google-forms/route.tsx`: preserve legacy behavior and optionally write `formVersion: 'legacy'`.
- `src/app/api/google-forms/v2/route.tsx`: receive the new form and use the v2 configuration.
- `src/types.tsx`: add form version, email and responsible-ownership fields.
- `.env.example`: add `GOOGLE_FORMS_V2_API_SECRET` without adding real values.

### 12.2 Shared Google Forms utilities

Prefer a small internal module for version-specific schemas and shared processing. Possible files:

- `src/lib/googleForms/formSchemas.ts`
- `src/lib/googleForms/formPresentation.ts`
- `src/lib/googleForms/alerts.ts`
- `src/lib/googleForms/normalize.ts`

The exact file names may be adjusted to the repository structure. The important separation is:

- Legacy map and labels remain stable.
- V2 map and labels are independent.
- Shared utilities contain only generic behavior.

### 12.3 Evaluation

Expected files:

- `src/lib/evaluation/shared.ts`: preserve legacy prompts and add the v2 profile.
- `src/lib/evaluation/actions.ts`: select the evaluation profile during retries.

### 12.4 Presentation

Expected files:

- `src/lib/constants/formLabels.ts`: preserve legacy labels and add or delegate to version-specific definitions.
- `src/lib/generateFormPdf.ts`: render responses using the resolved form version.
- `src/app/plam-admin/formularios/FormulariosPageContent.tsx`: use ordered definitions and show alerts.
- `src/app/plam-admin/formularios/[id]/FormularioDetailContent.tsx`: use ordered definitions and show alerts.

## 13. Request Contract for the New AppScript

The new AppScript should send:

- A JSON body whose keys are the exact Google Sheets question headers.
- The question headers as strings.
- Answer values as strings or arrays according to the existing integration contract.
- An `Authorization` header in the form `Bearer <v2-secret>`.

The new AppScript must use:

```text
/api/google-forms/v2
```

It must not send the new payload to the legacy route.

The exact normalized header for the responsible-ownership question must be captured from the Google Sheet payload, not recreated from memory. The normalization function collapses line breaks and repeated whitespace, but punctuation and wording still need to match the v2 map.

## 14. Migration Strategy

### Phase 1: Implement isolated v2 intake

Create the v2 route, v2 map, v2 evaluation profile and v2 presentation definitions.

Keep the legacy route available and unchanged in behavior.

### Phase 2: Test with controlled payloads

Send a legacy sample payload to `/api/google-forms`.

Send a new-form sample payload to `/api/google-forms/v2`.

Verify that:

- Both routes return successful persistence responses.
- Both documents are written to `googleForms`.
- Legacy records use legacy behavior.
- V2 records have `formVersion: 'v2'`.
- V2 records have the two email fields independently.
- The combined food answer is stored in `petDiet`.
- The responsible-ownership answer is stored.
- The responsible-ownership alert is shown for `No estoy de acuerdo` and `Otro`.
- Every record remains `pending` for human review.

### Phase 3: Configure the new AppScript

Point the new Google Sheet AppScript to `/api/google-forms/v2`.

Store the v2 secret in the server environment and in the AppScript configuration using the repository's existing secret-handling process.

Do not place the secret in client-exposed environment variables.

### Phase 4: Coexistence period

Keep both routes operational.

Monitor route logs and Firestore records for:

- Unexpected v2 question labels.
- Unmapped answers.
- Missing `formVersion` in v2 records.
- Evaluation failures.
- Incorrect alert classification.
- Incorrect presentation order.

Avoid logging applicant email values or complete form answers.

### Phase 5: Legacy deprecation

Only after the organization confirms that the old form and old AppScript are no longer used:

1. Disable the old AppScript trigger.
2. Monitor for unexpected requests to `/api/google-forms`.
3. Remove or disable the legacy intake route in a separate change.
4. Revoke the legacy route secret if operationally appropriate.
5. Keep the legacy evaluation profile for historical documents and manual retries.

The deprecation change must be separate from the initial v2 implementation so the migration can be rolled back without restoring unrelated code.


If the v2 route fails during migration:

- Point the new AppScript back to the known working legacy integration only if the payload remains compatible.
- Keep v2 documents already stored in `googleForms`; do not delete them.
- Do not run a destructive Firestore migration.
- Preserve the v2 `formVersion` value so records can be diagnosed later.
- Revert only the AppScript endpoint configuration or disable the v2 route if necessary.

Because the legacy route and v2 route are independent, the rollback should not require reverting the legacy map or legacy prompt.


### 16.1 Type and build checks

Run:

```bash
pnpm exec tsc --noEmit
pnpm run lint
pnpm build
```

Run Prettier on every edited file according to the repository configuration.

Do not install a test framework without user approval. The project currently does not define a test script.

### 16.2 Legacy compatibility tests

Use a representative legacy payload and verify:

- The legacy route still authenticates with the existing secret.
- Existing question labels still map to the same canonical fields.
- Legacy fields such as `foodBrands`, `petNeeds`, `growthTolerance` and `sizePreference` are retained.
- The legacy prompt still receives the same applicable data.
- The retry action selects the legacy profile.
- The form appears in the existing administrative interface.
- The legacy PDF order remains unchanged.

### 16.3 V2 mapping tests

Use a representative v2 payload and verify:

- New wording maps to the intended canonical field.
- The combined food response maps only to `petDiet`.
- The two email responses are not overwritten.
- The responsible-ownership answer maps to its own field.
- Removed legacy questions do not appear as missing information in the v2 evaluation.
- `formVersion` is stored as `v2`.
- The v2 prompt is selected.
- The v2 retry path selects the v2 prompt.

### 16.4 Responsible-ownership tests

Test all expected options:

- `Estoy de acuerdo` produces no alert.
- `No estoy de acuerdo` produces a red alert.
- `Otro` produces an amber alert.
- `Otro: ...` produces an amber alert.
- Empty response produces a review alert.
- Unexpected response produces a review alert.
- None of these responses causes an HTTP rejection.
- None of these responses automatically changes the status.
- The evaluator can still manually choose the final status.

### 16.5 Presentation tests

Verify that:

- Legacy forms render in legacy question order.
- V2 forms render in new question order.
- V2 labels use the new wording.
- The combined food question appears once.
- Both email fields appear at their respective positions.
- The responsible-ownership question appears at its respective position.
- Raw-only fields do not disrupt the canonical order.
- The PDF uses the same ordering as the administrative interface.


Verify that:

- Neither email field is sent to Google AI.
- Neither email field is sent to Groq.
- Emails are not written to technical logs.
- Secrets are not present in source files.
- `GOOGLE_FORMS_V2_API_SECRET` is not prefixed with `NEXT_PUBLIC_`.
- `rawData` remains accessible only through the existing authorized administration flow.


### Risk: The old route receives new-form data

Mitigation: configure the new AppScript with the explicit `/v2` route and keep the v2 secret separate.

### Risk: A merged map silently overwrites fields

Mitigation: maintain independent maps and independent route configurations.

### Risk: A v2 record is evaluated with legacy criteria

Mitigation: store `formVersion` and pass an explicit evaluation profile to initial and retry evaluations.

### Risk: A legacy record is evaluated with v2 criteria

Mitigation: treat missing `formVersion` as legacy and preserve the legacy default.

### Risk: Firestore map order changes the response order

Mitigation: use explicit version-specific presentation definitions.

### Risk: The two email values overwrite one another

Mitigation: use `applicantEmail` and `googleAccountEmail` as separate fields.

### Risk: The AI misses the brand inside the combined food answer

Mitigation: explicitly document in the v2 prompts that `petDiet` includes brand names and retain the existing brand criteria.

### Risk: The law response is treated as an automatic rejection

Mitigation: make the response an independent human-review alert and never mutate `status` automatically.

### Risk: An unknown response is silently ignored

Mitigation: classify missing and unexpected answers as review alerts and preserve the original answer in `rawData`.

### Risk: New question headers differ from the supplied list

Mitigation: capture a real AppScript payload from the new Sheet and verify every key against the v2 map before production cutover.


The following items must be verified before implementation is considered complete:

- The exact Google Sheets header for the responsible-ownership question.
- Whether the `Otro` answer includes custom text in the payload.
- Whether the Google-collected email column is always present or can be empty.
- Whether the new AppScript sends arrays for any multiple-choice or checkbox answers.
- Whether the informational adoption-responsibility paragraph appears as a Sheet column despite requiring no answer.
- Whether the organization wants both email values displayed in the PDF immediately or only stored for the later applicant-profile phase.


The implementation is complete when all of the following are true:

1. The old route continues accepting old-form submissions.
2. The new form uses `/api/google-forms/v2`.
3. The old and new question maps are independent.
4. Both routes write to `googleForms`.
5. V2 records include `formVersion: 'v2'`.
6. Legacy records without a version continue to behave as legacy records.
7. The old and new evaluation profiles are independent.
8. V2 evaluation does not penalize intentionally omitted legacy questions.
9. Legacy evaluation still supports legacy-only questions.
10. The combined food answer is evaluated through `petDiet`.
11. The two email values are stored separately.
12. The email values are excluded from AI input.
13. The responsible-ownership answer is stored separately from the castration answer.
14. `No estoy de acuerdo` produces a prominent evaluator alert.
15. `Otro` produces a prominent evaluator alert.
16. No responsible-ownership answer automatically rejects or blocks a form.
17. All submissions remain under human status control.
18. V2 responses display in the new form order.
19. Legacy responses display in the legacy form order.
20. The PDF and administrative interface use the same version-specific order.
21. The retry action selects the correct evaluation profile.
22. The new AppScript can be switched on without disabling the old route.
23. The old route can later be retired independently.
24. The legacy evaluation profile remains available for historical records.
25. TypeScript, lint and production build checks pass.


Separate the input contracts now, share the storage and administration layer, and postpone deprecation until real traffic confirms that the old form is no longer used.

The implementation should duplicate the route boundary, map, presentation order and evaluation profile, but should not duplicate generic persistence and validation logic unnecessarily.
