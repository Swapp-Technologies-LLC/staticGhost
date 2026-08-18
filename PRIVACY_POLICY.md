# StaticGhost — Privacy Policy

> **DRAFT — PREPARED FOR REVIEW BY LICENSED COUNSEL. NOT YET IN EFFECT.**
> Do not publish or link this from the product until an attorney has reviewed it.
> Bracketed `[[...]]` items are open questions that need a decision or a fact you must supply.

**Data Controller:** Swapp Technologies LLC, [[registered address]], Texas, USA
**Contact:** privacy@swapp.solutions *(mailbox must exist before publishing)*
**Last updated:** [[date]]
**Version:** Draft 0.1

---

## 0. Read this first: three different sets of people

This policy is confusing unless it is clear whose data is being discussed. There are three distinct groups, and StaticGhost treats them very differently:

| Group | Who they are | What we collect |
| :--- | :--- | :--- |
| **A. Desktop users** | People who download and run the StaticGhost desktop app | Nothing, in the Community Edition |
| **B. Customers** | People who buy Pro, LTD, or migration services | Billing and account data |
| **C. Blog visitors** | People who read a blog *published by* a StaticGhost user | Nothing by default; limited analytics only if the publisher enables Pro telemetry |

Group C is the important one. If you are a StaticGhost user who enables Pro analytics, **you** are the controller of your visitors' data and **we** act as your processor. Section 5 explains what that means for you.

---

## 1. Community Edition desktop app — no collection

The StaticGhost Community Edition does not transmit usage data, telemetry, blog content, or credentials to Swapp Technologies LLC. It has no analytics SDK, no crash reporter, and no update beacon.

Data the app creates stays on your machine:

- **Project profiles** (`project-profiles.json`) in the Electron `userData` directory
- **Ghost API keys and deployment tokens**, encrypted at rest via your OS keychain (Windows DPAPI / macOS Keychain / Linux Secret Service)
- **Local Ghost content**, inside Docker volumes on your disk
- **Application logs**, in the local log directory

To delete all of it: uninstall the app and delete the `userData` directory and any Docker volumes you created.

**Third-party services the app contacts on your instruction:** GitHub, Netlify, Vercel, Cloudflare, Render, and your own local Ghost instance. These are contacted only when you initiate an action, using credentials you supply, and each is governed by its own privacy policy. We do not receive a copy of that traffic.

---

## 2. Exported blogs — what ends up in your published HTML

StaticGhost writes static files that you then host yourself. Some features embed third-party resources into those files. **These affect your visitors, and you are responsible for disclosing them in your own site's privacy policy.**

| Feature | What it embeds | What your visitors' browsers send, and to whom |
| :--- | :--- | :--- |
| **Password-protected posts** | Inline script using the browser's native WebCrypto API | Nothing to third parties — no external script is loaded |
| **Giscus comments** | A Giscus iframe backed by GitHub Discussions | Visitor IP to GitHub; comment content is public on your repo; commenters need a GitHub account |
| **Pagefind search** | Search index files served from your own host | Nothing to third parties |
| **Affiliate link auto-tagging** | `rel` and `target` attributes on outbound links | Nothing extra; the destination site sees the referral |
| **Pro edge analytics** *(off by default)* | A ~1KB beacon script | See Section 3 |

> **Resolved 2026-08-18.** The CDN dependency has been removed. Decryption now uses the browser's native WebCrypto (`crypto.subtle`) with AES-256-GCM, so no third-party script is fetched and no visitor IP is disclosed for protected posts.
>
> **Also resolved:** exported sites previously embedded a Cloudflare Web Analytics beacon **by default**. Third-party analytics are now strictly opt-in — a fresh export contains no tracker at all.

---

## 3. Pro edge analytics (opt-in, off by default)

If you enable Pro analytics, a beacon in your exported pages sends events to a Cloudflare Worker operated by Swapp Technologies LLC.

**Collected per event:**

- Page path/slug of the post being read
- Event type (pageview, read-completion at 75% scroll, affiliate link click)
- Timestamp
- [[Confirm: is the visitor IP address stored, or only used transiently for bot filtering and then discarded? Is it truncated or hashed? This single answer changes the policy's legal posture substantially.]]
- [[Confirm: user-agent, referrer, country — collected or not?]]

**Not collected:** names, email addresses, cookies, cross-site identifiers, device fingerprints, or the content of posts.

**Retention:** [[specify — e.g. aggregate counters kept indefinitely, raw events discarded after N days]]
**Storage location:** Cloudflare KV, [[specify regions]]
**Sub-processors:** Cloudflare, Inc. [[list any others]]

**Legal basis (GDPR):** [[Almost certainly consent under ePrivacy, because the beacon accesses/stores information on the visitor's terminal equipment and is not strictly necessary to deliver the page. If so, StaticGhost must ship a consent mechanism — analytics must not fire before consent. Legitimate interest is unlikely to be sufficient on its own. Confirm with counsel.]]

---

## 4. Customer and billing data

When you purchase Pro, an LTD, or a migration service:

- **Payment card data** goes directly to Stripe. We never see or store full card numbers.
- **We store:** your email address, license key, subscription status, and Stripe customer ID.
- **Purpose:** delivering and supporting what you bought, and meeting tax and accounting obligations.
- **Legal basis (GDPR):** performance of a contract; legal obligation for tax records.
- **Retention:** for the life of the account, then as required by tax law ([[typically 7 years — confirm]]).
- **Sub-processors:** Stripe, Inc.; [[email provider]]; [[support tooling]].

---

## 5. When you are the controller and we are your processor

If you enable Pro analytics on a blog you publish, your visitors' data is being processed on your instructions. Under GDPR Article 28 that makes you the controller and Swapp Technologies LLC your processor, and it requires a **written data processing agreement** between us.

- **[[Action required]]** A DPA must be drafted and made available — ideally auto-accepted at Pro signup. Offering Pro analytics to any EU-facing customer without one is a compliance gap on both sides.
- You are responsible for your own site's privacy notice, your own consent mechanism, and for responding to your visitors' data-subject requests. We will assist as processor.
- **[[Confirm]]** Whether Standard Contractual Clauses are needed for transfers out of the EEA/UK, given Cloudflare's processing locations.

---

## 6. Your rights

**If GDPR/UK GDPR applies to you:** access, rectification, erasure, restriction, portability, objection, and withdrawal of consent; and the right to complain to your supervisory authority.

**If you are a California resident (CCPA/CPRA):** the rights to know, delete, correct, and opt out of sale/sharing, and not to be discriminated against for exercising them. Swapp Technologies LLC does not sell or share personal information as those terms are defined under the CPRA. [[Confirm this remains true if any ad or affiliate network is ever added.]]

To exercise any of these, contact privacy@swapp.solutions. We respond within [[30 days / 45 days]].

---

## 7. Children

StaticGhost is a developer tool and is not directed to children under 13, and we do not knowingly collect their personal information. Note that Giscus comments require a GitHub account, and GitHub's own terms set a minimum age.

---

## 8. Security

Credentials are encrypted at rest using OS-native keychains. Analytics traffic is transmitted over HTTPS. No system is perfectly secure, and we cannot guarantee absolute security.

**Breach notification:** we will notify affected users and regulators as required by applicable law. [[An internal incident response procedure needs to exist to back this sentence up.]]

---

## 9. Changes

Material changes will be announced in the repository and, for Pro customers, by email at least [[30]] days before taking effect.

---

## Open items blocking publication

1. Decide and document exactly what the analytics beacon collects — especially the IP address question in Section 3.
2. ~~Decide whether to self-host `crypto-js`~~ — **done**: replaced with native WebCrypto, no external script.
3. Draft the Article 28 DPA referenced in Section 5.
4. Build the consent mechanism if counsel confirms consent is the required legal basis.
5. Create the `privacy@swapp.solutions` mailbox.
6. Confirm retention periods and Cloudflare processing regions.
