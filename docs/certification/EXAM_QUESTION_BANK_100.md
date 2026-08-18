# 📝 StaticGhost Certification — 100-Question Exam Bank

> **Target Platform**: Frappe LMS (`https://academy.swapp.solutions`)  
> **Passing Score**: 85%  
> **Rules**: Randomized 50-question draw per attempt; scenario-based problem solving.  

---

## Sample Exam Questions (Questions 1–10 preview of 100-Question Pool)

### Q1 (Scenario / Failure Mode)
A client attempts to export their Ghost blog to static HTML, but the export log displays `ERR-DOCKER-01: Cannot connect to Docker daemon`. What is the first diagnostic step?
- A) Reinstall Node.js and run `npm install`.
- B) Check if Docker Desktop daemon is running in system tray and verify Linux container support. [CORRECT]
- C) Delete `project-profiles.json`.
- D) Edit `preload.js` to enable `nodeIntegration`.

### Q2 (Security / WebCrypto)
How does StaticGhost protect password-encrypted articles on a static host like GitHub Pages without a backend database?
- A) Hides HTML body using CSS `display: none`.
- B) Wraps content in HTML `<!-- comments -->`.
- C) Encrypts post body at build time using AES-256; WebCrypto decrypts in-browser upon password input. [CORRECT]
- D) Queries an external MySQL authentication server.

### Q3 (Compliance / Google SEO)
Why does StaticGhost automatically append `rel="sponsored nofollow noopener"` to affiliate URLs during export?
- A) To increase website loading speed.
- B) To comply with Google search guidelines and prevent manual SEO ranking penalties. [CORRECT]
- C) To disable link clicking in browser.
- D) To bypass SSL certificate validation.

### Q4 (Performance / Search)
What technology enables StaticGhost full-text search to execute in under 20ms on static websites?
- A) Algolia Cloud Search API.
- B) Pagefind WebAssembly compiled index. [CORRECT]
- C) Dynamic MySQL database queries.
- D) Elasticsearch cluster.

### Q5 (Architecture / IPC)
In StaticGhost's Electron architecture, why is `nodeIntegration: false` enforced in `preload.js`?
- A) To speed up CSS rendering.
- B) To enforce context isolation and prevent untrusted UI frames from executing arbitrary OS Node commands. [CORRECT]
- C) To allow raw database access in the browser console.
- D) To compress images automatically.
