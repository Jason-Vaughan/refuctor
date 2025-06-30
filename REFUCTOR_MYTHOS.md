# Refuctor System Architecture & Process Documentation

> **"The Debt Cleansing Syndicate - Visual Guide for Humanzees"**

**Status**: Phase 1 CLI Foundation ✅ COMPLETE
**Version**: 0.1.0-beta.1
**Last Updated**: January 3, 2025

---

## 🎯 System Overview

Refuctor
is a professional technical debt management system with snarky personality.
Think "debt collection agency for your code" - it finds,
categorizes, and helps eliminate technical debt across your projects.

```mermaid
graph TB
    A["🧑‍💻 Developer"] --> B["refuctor CLI"]
    B --> C["Debt Detection Engine"]
    B --> D["Debt Ignore System"]
    B --> E["Goon Tools"]
    B --> F["Session Management"]

    C --> G["📝 Markdown Linting"]
    C --> H["📖 Spell Checking"]
    C --> I["🔒 Security Audit"]
    C --> J["📦 Dependency Check"]

    D --> K[".debtignore Parser"]
    K --> L["Pattern Matching"]

    E --> M["Markdown Fixer Goon"]
    E --> N["Future Goons"]

    F --> O["TECHDEBT.md Tracking"]
    F --> P["Session Wrap Protocol"]

    style A fill:#e1f5fe
    style B fill:#ffecb3
    style C fill:#f3e5f5
    style D fill:#e8f5e8
    style E fill:#fff3e0
    style F fill:#fce4ec
```text
---

## 🏗️ Core Architecture

### **File Structure (Actual Implementation)**

```mermaid
graph TD
    A["📁 Refuctor Project"] --> B["📁 cli/"]
    A --> C["📁 src/"]
    A --> D["📁 templates/"]
    A --> E["📄 Configuration Files"]

    B --> B1["refuctor-cli.js"]

    C --> C1["debt-detector.js"]
    C --> C2["debt-ignore-parser.js"]
    C --> C3["techdebt-manager.js"]
    C --> C4["index.js"]
    C --> C5["📁 goons/"]

    C5 --> C51["markdown-fixer.js"]

    D --> D1["TECHDEBT.md"]
    D --> D2["cspell.json"]

    E --> E1["package.json"]
    E --> E2[".debtignore"]
    E --> E3[".gitignore"]
    E --> E4["README.md"]

    style A fill:#e3f2fd
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style D fill:#e8f5e8
    style E fill:#fce4ec
```text
---

## ⚡ CLI Command Architecture

### **Complete Command Structure (11 Commands)**

```mermaid
graph LR
    A["refuctor"] --> B1["scan"]
    A --> B2["status"]
    A --> B3["init"]
    A --> B4["shame"]
    A --> B5["fix"]
    A --> B6["wrap"]
    A --> B7["bailmeout"]
    A --> B8["goon"]
    A --> B9["exterminate"]
    A --> B10["dependencies"]
    A --> B11["ignore"]

    B1 --> C1["🔍 Debt Detection<br/>P1-P4 Categories"]
    B2 --> C2["📊 Status Dashboard<br/>Trends & Metrics"]
    B3 --> C3["🏗️ Project Setup<br/>TECHDEBT.md Creation"]
    B4 --> C4["😱 Humorous Reports<br/>Shame Calculations"]
    B5 --> C5["🔧 Auto-Repair<br/>Safe Fixes Only"]
    B6 --> C6["📋 Session Protocol<br/>9-Step Process"]
    B7 --> C7["🆘 Motivation Quotes<br/>Easter Egg"]
    B8 --> C8["💀 Specialized Tools<br/>fix-markdown"]
    B9 --> C9["🔥 Mass Elimination<br/>Deploy All Goons"]
    B10 --> C10["📦 Dependency Check<br/>Missing Packages"]
    B11 --> C11["🚫 Ignore Management<br/>.debtignore System"]

    style A fill:#ffeb3b
    style B1 fill:#e3f2fd
    style B2 fill:#e3f2fd
    style B3 fill:#e3f2fd
    style B4 fill:#e3f2fd
    style B5 fill:#e3f2fd
    style B6 fill:#e3f2fd
    style B7 fill:#fff3e0
    style B8 fill:#f3e5f5
    style B9 fill:#ffebee
    style B10 fill:#e8f5e8
    style B11 fill:#fce4ec
```text
---

## 🔍 Debt Detection Process

### **How `refuctor scan` Works**

```mermaid
flowchart TD
    A["🚀 refuctor scan"] --> B["Load .debtignore patterns"]
    B --> C["Find all files in project"]
    C --> D["Filter ignored files"]
    D --> E["Scan remaining files"]

    E --> F["📝 Markdown Lint"]
    E --> G["📖 Spell Check"]
    E --> H["🔒 Security Audit"]
    E --> I["📦 Dependency Check"]

    F --> J{"Violations > 50?"}
    G --> K{"Errors > 20?"}
    H --> L{"High CVE?"}
    I --> M{"Unused deps?"}

    J -->|Yes| N["🚨 P1 Critical"]
    J -->|10-50| O["⚠️ P2 High"]
    J -->|3-10| P["📋 P3 Medium"]
    J -->|1-3| Q["💰 P4 Low"]

    K -->|Yes| N
    K -->|5-20| O
    K -->|2-5| P
    K -->|1-2| Q

    L -->|Yes| N
    M -->|Yes| P

    N --> R["📊 Generate Report"]
    O --> R
    P --> R
    Q --> R
    R --> S["🎭 Add Snarky Messages"]
    S --> T["💬 Display Results"]

    style A fill:#4caf50
    style N fill:#f44336
    style O fill:#ff9800
    style P fill:#2196f3
    style Q fill:#9e9e9e
```text
---

## 🚫 Debt Ignore System

### **How `.debtignore` Works**

```mermaid
flowchart TD
    A[".debtignore file"] --> B["Parse patterns"]

B
-->
C["Default
patterns<br/>node_modules/**<br/>.git/**<br/>dist/**<br/>build/**<br/>*.tmp<br/>
*.temp"]

B
--> D["Custom patterns<br/>REFUCTOR_MYTHOS.md<br/>*-draft.md<br/>experiments/"]

    C --> E["Combine all patterns"]
    D --> E
    E --> F["File scan request"]
    F --> G{"Match patterns?"}
    G -->|Yes| H["🚫 IGNORE FILE"]
    G -->|No| I["✅ SCAN FILE"]

    I --> J["Debt detection"]
    H --> K["Skip from debt tracking"]

    style A fill:#e3f2fd
    style C fill:#fff3e0
    style D fill:#e8f5e8
    style H fill:#ffebee
    style I fill:#e8f5e8
```text
### **Ignore Management Commands**

```mermaid
graph LR
    A["refuctor ignore"] --> B1["--init"]
    A --> B2["--list"]
    A --> B3["--add <pattern>"]
    A --> B4["--remove <pattern>"]

    B1 --> C1["Create sample<br/>.debtignore file"]
    B2 --> C2["Show current<br/>patterns"]
    B3 --> C3["Add new<br/>ignore pattern"]
    B4 --> C4["Remove existing<br/>pattern"]

    style A fill:#ffeb3b
    style B1 fill:#4caf50
    style B2 fill:#2196f3
    style B3 fill:#ff9800
    style B4 fill:#f44336
```text
---

## 💀 Goon Tool Architecture

### **Specialized Debt Elimination**

```mermaid
flowchart TD
    A["refuctor goon"] --> B["Goon Selection"]
    B --> C["fix-markdown"]
    B --> D["Future: clean-imports"]
    B --> E["Future: comment-killer"]
    B --> F["Future: dead-code-hunter"]

    C --> G["MarkdownFixerGoon Class"]
    G --> H["Load target file"]

H
-->
I["Apply
fixes:<br/>•
MD022
(headings)<br/>•
MD032
(lists)<br/>•
MD031
(code
blocks)<br/>•
MD040 (languages)<br/>• MD009 (trailing spaces)<br/>• MD047 (final newline)"]
    I --> J{"Preview mode?"}
    J -->|Yes| K["Show changes<br/>Don't save"]
    J -->|No| L["Save file<br/>Apply fixes"]
    K --> M["Report metrics"]
    L --> M
    M --> N["Success message<br/>with snark"]

    style A fill:#ffeb3b
    style C fill:#4caf50
    style D fill:#9e9e9e
    style E fill:#9e9e9e
    style F fill:#9e9e9e
    style G fill:#e3f2fd
```text
---

## 🔧 Auto-Fix Process

### **How `refuctor fix` Works**

```mermaid
flowchart TD
    A["refuctor fix"] --> B{"--dry-run?"}
    B -->|Yes| C["Preview mode"]
    B -->|No| D["Apply fixes"]

    C --> E["Find markdown files"]
    D --> E
    E --> F["Filter .debtignore"]
    F --> G["For each file:"]
    G --> H["Run MarkdownFixerGoon"]
    H --> I["Count fixes applied"]
    I --> J{"More files?"}
    J -->|Yes| G
    J -->|No| K["Generate report"]

    K --> L{"Dry run?"}
    L -->|Yes| M["⚠️ No changes made<br/>Remove --dry-run to apply"]
    L -->|No| N["✅ Fixes applied<br/>Debt refinanced!"]

    style A fill:#4caf50
    style C fill:#ff9800
    style D fill:#4caf50
    style M fill:#ff9800
    style N fill:#4caf50
```text
---

## 📋 Session Wrap Protocol

### **9-Step Process (`refuctor wrap`)**

```mermaid
flowchart TD
    A["refuctor wrap"] --> B["🔍 Step 1: Debt Assessment"]
    B --> C["📊 Step 2: Session Summary"]
    C --> D["💡 Step 3: Recommendations"]

    B --> B1["Run debt scan"]
    B1 --> B2{"Debt found?"}
    B2 -->|Yes| B3["⚠️ Report debt count"]
    B2 -->|No| B4["✅ Debt-free status"]

    C --> C1["Collect session data"]
    C1 --> C2["Timestamp activities"]
    C2 --> C3["File modification tracking"]

    D --> D1["🎯 Continue Phase 1"]
    D1 --> D2["🚀 Consider NPM publishing"]
    D2 --> D3["📈 Add specialized goons"]

    D3 --> E{"--brief flag?"}
    E -->|Yes| F["📝 Brief wrap complete"]
    E -->|No| G["📝 Comprehensive wrap complete"]

    style A fill:#2196f3
    style B fill:#e3f2fd
    style C fill:#e3f2fd
    style D fill:#e3f2fd
    style F fill:#4caf50
    style G fill:#4caf50
```text
---

## 🎯 Debt Priority System

### **P1-P4 Classification Logic**

```mermaid
graph TD
    A["Detected Issue"] --> B{"Issue Type?"}

    B --> C["📝 Markdown"]
    B --> D["📖 Spelling"]
    B --> E["🔒 Security"]
    B --> F["📦 Dependencies"]

    C --> C1{"> 50 violations?"}

C1
-->|Yes| G["🚨 P1 Critical<br/>This is fucking embarrassing.<br/>Fix it NOW."]
    C1 -->|No| C2{"10-50 violations?"}

C2
-->|Yes| H["⚠️ P2 High<br/>We're taking back the repo.<br/>Clean this today."]
    C2 -->|No| C3{"3-10 violations?"}
    C3 -->|Yes| I["📋 P3 Medium<br/>A bit crusty.<br/>Handle it this sprint."]
    C3 -->|No| J["💰 P4 Low<br/>Minor blemish.<br/>But you'll pay later..."]

    D --> D1{"> 20 errors?"}
    D1 -->|Yes| G
    D1 -->|No| D2{"5-20 errors?"}
    D2 -->|Yes| H
    D2 -->|No| D3{"2-5 errors?"}
    D3 -->|Yes| I
    D3 -->|No| J

    E --> E1{"High/Critical CVE?"}
    E1 -->|Yes| G
    E1 -->|No| I

    F --> F1{"Unused dependencies?"}
    F1 -->|Yes| I
    F1 -->|No| J

    style G fill:#f44336
    style H fill:#ff9800
    style I fill:#2196f3
    style J fill:#9e9e9e
```text
---

## 📦 Project Initialization

### **How `refuctor init` Sets Up Projects**

```mermaid
flowchart TD
    A["refuctor init"] --> B{"TECHDEBT.md exists?"}
    B -->|Yes| C{"--force flag?"}
    B -->|No| D["Create TECHDEBT.md"]

    C -->|Yes| D
    C -->|No| E["⚠️ Already exists<br/>Use --force to overwrite"]

    D --> F["Copy template"]
    F --> G["Set project timestamp"]
    G --> H["Initialize debt tracking"]
    H --> I["Create .debtignore if missing"]
    I --> J["✅ Debt tracking activated"]
    J --> K["💡 Run 'refuctor scan' to start"]

    style A fill:#4caf50
    style D fill:#4caf50
    style E fill:#ff9800
    style J fill:#4caf50
    style K fill:#2196f3
```text
---

## 🎭 Personality System

### **Snarky Message Generation**

```mermaid
graph TD
    A["Debt Level"] --> B["P1 Critical"]
    A --> C["P2 High"]
    A --> D["P3 Medium"]
    A --> E["P4 Low"]
    A --> F["Zero Debt"]


B
-->
B1["Financial
Metaphors:<br/>•
Foreclosure imminent<br/>• Technical bankruptcy<br/>• Repo repossession"]

C
-->
C1["Collection
Notices:<br/>•
Taking back the repo<br/>• Payment overdue<br/>• Interest accruing"]

D
-->
D1["Warning
Signs:<br/>• A bit crusty<br/>• Liens filed<br/>• Handle this sprint"]

E
-->
E1["Minor
Issues:<br/>• Minor blemish<br/>• You'll pay later<br/>• Interest accruing"]

F
-->
F1["Celebration:<br/>•
Magnificent
debt-slayer<br/>• Cleaner than banker's conscience<br/>• Debt eliminated!"]

    style A fill:#ffeb3b
    style B fill:#f44336
    style C fill:#ff9800
    style D fill:#2196f3
    style E fill:#9e9e9e
    style F fill:#4caf50
```text
---

## 🚀 Phase 1 Completion Status

### **Implementation Progress**

```mermaid
gantt
    title Refuctor Phase 1 Development
    dateFormat  YYYY-MM-DD
    section Core CLI
    Basic Commands         :done, basics, 2024-12-28, 2025-01-01
    Debt Detection        :done, detection, 2025-01-01, 2025-01-02
    Goon Tools           :done, goons, 2025-01-02, 2025-01-03
    Debt Ignore System   :done, ignore, 2025-01-03, 2025-01-03
    section Documentation
    README & Roadmap     :done, docs1, 2024-12-28, 2025-01-01
    Architecture Docs    :done, docs2, 2025-01-03, 2025-01-03
    section Publishing
    NPM Package Prep     :active, npm, 2025-01-03, 2025-01-04
    Beta Release         :beta, 2025-01-04, 2025-01-05
```text
---

## 📊 Current System Metrics

**Commands Implemented**: 11/11 ✅ COMPLETE
**Core Modules**: 4/4 ✅ COMPLETE
**Goon Tools**: 1/4 (Markdown Fixer working)
**Debt Categories**: P1-P4 system ✅ COMPLETE
**Ignore System**: Professional .debtignore ✅ COMPLETE
**Testing Status**: Self-validated (recursive debt management) ✅
**Documentation**: Visual guides with Mermaid ✅

---

**"Refactor or Be Repossessed!"** - *The Debt Cleansing Syndicate*

*Making
technical debt management actually understandable for humanzees since 2025.*
