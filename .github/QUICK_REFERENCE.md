# 🔒 Quick Reference - Branch Protection

## Status: ✅ PROTECTED

### Who can access `main` branch:
- **✅ GustavoEraso**: Full access (PR, merge, push)
- **❌ Others**: Read-only access

---

## 🚨 Error Messages You Might See

### "❌ Error: Only GustavoEraso can create pull requests to main branch"
**Solution**: Create PR to a development branch instead

### "❌ Error: Only GustavoEraso can push to main branch"
**Solution**: Work on feature branches and create PRs

### "⚠️ Build failed (may be due to network issues in CI environment)"
**Info**: This might happen due to external dependencies (Google Fonts). The workflow handles this gracefully.

---

## 🛠️ Quick Commands

```bash
# Check current branch
git branch

# Create new feature branch
git checkout -b feature/my-feature

# Switch to main and pull latest
git checkout main && git pull origin main

# Merge main into your feature branch
git checkout feature/my-feature && git merge main
```

---

## 📁 Protection Files

| File | Purpose |
|------|---------|
| `.github/workflows/branch-protection.yml` | Main protection logic |
| `.github/workflows/pr-validation.yml` | PR validation |
| `.github/workflows/security-check.yml` | Security scanning |
| `.github/CODEOWNERS` | Review requirements |
| `.github/BRANCH_PROTECTION.md` | Full documentation |
| `CONTRIBUTING.md` | Contribution guidelines |

---

## 🆘 Need Help?

1. **Read**: [Branch Protection Documentation](.github/BRANCH_PROTECTION.md)
2. **Read**: [Contributing Guidelines](../CONTRIBUTING.md)
3. **Contact**: GustavoEraso
4. **Create Issue**: Use the branch protection issue template

---

**Last Updated**: $(date)
**Protection Level**: 🟢 MAXIMUM