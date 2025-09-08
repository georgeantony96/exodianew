# 🔄 PROJECT CONTEXT LOADER
## Automated Documentation Review for Quality Maintenance

### **THE PROBLEM**
Without reading project documentation at the start of each session, Claude gets "sloppy" and:
- Makes the same mistakes repeatedly
- Ignores established patterns and principles
- Applies quick fixes instead of holistic solutions
- Misses critical project context and constraints

### **THE SOLUTION**
Implement automated project context loading using multiple complementary approaches.

---

## **🎯 IMPLEMENTATION OPTIONS**

### **Option 1: Claude Settings Hook (RECOMMENDED)**

Add to `.claude/settings.local.json`:

```json
{
  "hooks": {
    "user-prompt-submit": {
      "command": "echo 'REMINDER: Read PROJECT_ANALYSIS_PROTOCOL.md, HOLISTIC_PROBLEM_SOLVING_PRINCIPLES.md, and recent CHANGELOG.md entries before proceeding with any technical work.'",
      "description": "Remind to read project documentation first"
    }
  }
}
```

### **Option 2: Project Initialization Command**

Create a command that you run at the start of each session:

```bash
# Add to your workflow
echo "🔄 STARTING EXODIA FINAL SESSION - Reading project context..."
```

### **Option 3: Explicit Instruction Pattern**

**ALWAYS start sessions with**: "Read project docs first, then help me with [your request]"

### **Option 4: Automated Script**

Create a startup script that reminds both you and Claude:

```bash
#!/bin/bash
echo "============================================"
echo "🎯 EXODIA FINAL PROJECT SESSION STARTED"
echo "============================================"
echo "📋 REQUIRED READING BEFORE ANY WORK:"
echo "1. PROJECT_ANALYSIS_PROTOCOL.md"
echo "2. HOLISTIC_PROBLEM_SOLVING_PRINCIPLES.md"
echo "3. Recent CHANGELOG.md entries"
echo "4. DESIGN_SYSTEM_REFERENCE.md"
echo "5. CLAUDE_TECHNICAL_REFERENCE_2025.md"
echo "============================================"
```

---

## **📚 MANDATORY READING LIST**

### **Primary Documents (ALWAYS READ)**
1. **PROJECT_ANALYSIS_PROTOCOL.md** - Overall workflow and approach
2. **HOLISTIC_PROBLEM_SOLVING_PRINCIPLES.md** - Problem-solving methodology
3. **CHANGELOG.md** (recent entries) - Latest fixes and known issues

### **Secondary Documents (READ AS NEEDED)**
4. **DESIGN_SYSTEM_REFERENCE.md** - UI/UX guidelines
5. **CLAUDE_TECHNICAL_REFERENCE_2025.md** - Technical deep dive
6. **UI_UX_RESEARCH_REPORT_2025.md** - Interface patterns
7. **TECHNICAL_RESEARCH_SOLUTIONS.md** - Proven solution patterns

---

## **🔧 QUALITY CHECKLIST**

### **Before Starting Any Work:**
- [ ] Read PROJECT_ANALYSIS_PROTOCOL.md
- [ ] Review HOLISTIC_PROBLEM_SOLVING_PRINCIPLES.md
- [ ] Check recent CHANGELOG.md entries
- [ ] Understand current project status and recent fixes
- [ ] Apply root cause analysis approach
- [ ] Consider holistic system impact

### **During Problem Solving:**
- [ ] Ask "What is the root cause?" before coding
- [ ] Map component hierarchy and data flow
- [ ] Consider impact on entire system
- [ ] Test legacy format compatibility
- [ ] Verify database schema alignment
- [ ] Apply established patterns from TECHNICAL_RESEARCH_SOLUTIONS.md

### **Quality Indicators:**
✅ **Good**: References specific documentation, explains root cause, considers system impact
❌ **Sloppy**: Immediate coding, ignores patterns, applies quick fixes

---

## **🎯 SESSION STARTUP PROTOCOL**

### **Recommended Workflow:**
1. **User starts session**: "Read project docs first, then help me with [request]"
2. **Claude reads documentation**: Uses TodoWrite to track progress
3. **Claude confirms context**: "Project context loaded, ready to proceed"
4. **Work begins**: With full architectural understanding

### **Emergency Context Load:**
If you notice sloppy solutions during a session, say:
> "Stop - read the project documentation first using the holistic approach"

---

## **💡 WHY THIS MATTERS**

### **With Documentation Review:**
- Solutions address root causes
- Consistent with established patterns  
- Considers entire system architecture
- Prevents regression of known issues
- Maintains code quality standards

### **Without Documentation Review:**
- Quick fixes that break later
- Repeated mistakes from changelog
- Ignores established design patterns
- Creates technical debt
- Frustrates user with sloppy work

---

## **🔄 MAINTENANCE**

### **Keep Updated:**
- Add new lessons learned to documentation
- Update changelog with each fix
- Refine holistic principles based on experience
- Document new solution patterns

### **Review Effectiveness:**
- Monitor solution quality over time
- Adjust documentation loading based on results
- Continuously improve the process

---

**REMEMBER**: "Look at it holistically please see all page structure" - This user feedback should guide every session startup and technical decision.