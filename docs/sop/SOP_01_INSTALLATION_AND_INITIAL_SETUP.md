# 📋 SOP-01: Installation & Initial Environment Setup

> **SOP ID**: `SOP-STATICGHOST-01`  
> **Category**: Field Operations & Environment Setup  
> **Target Role**: Certified StaticGhost Operator / Field Technician  

---

## 1. Objective
To install prerequisite runtimes, clone the StaticGhost repository, configure local Docker Desktop services, and launch the StaticGhost desktop interface successfully.

## 2. Prerequisites & Tooling Required
* **Hardware**: x86_64 or ARM64 Computer (Windows 10/11, macOS 12+, or Ubuntu Linux 22.04+). Minimum 8GB RAM.
* **Software Tools**:
  1. Node.js v18.x or v20.x LTS (`node -v`)
  2. Git SCM CLI (`git --version`)
  3. Docker Desktop v4.20+ (`docker --version`)

## 3. Step-by-Step Installation Procedure

### Step 3.1: Environment Verification
Open terminal/PowerShell and execute:
```bash
node -v
npm -v
docker info
```
Ensure Docker Desktop is running in system tray with Linux container support enabled.

### Step 3.2: Clone Repository & Install Dependencies
```bash
git clone https://github.com/swapptech/staticGhost.git
cd staticGhost
npm install
```

### Step 3.3: Verify Automated Test Suite
Before launching the application GUI, execute the 6-part verification test suite:
```bash
npm test
```
*Expected Result*: `🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉`

### Step 3.4: Launch Desktop Application
```bash
npm start
```
The StaticGhost desktop app UI will open displaying the dark-mode control dashboard (`#0b0f19`).

---

## 4. Verification & Sign-Off Checklist
- [ ] Node.js v18+ verified.
- [ ] Docker Desktop daemon running in background.
- [ ] `npm test` passes 6/6 test suites.
- [ ] StaticGhost desktop window displays active profile controls.
