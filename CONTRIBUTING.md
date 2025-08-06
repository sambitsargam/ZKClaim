# Contributing to ZKClaim

We're thrilled that you're interested in contributing to ZKClaim! This document provides guidelines for contributing to our zero-knowledge healthcare claims system.

## 🌟 How to Contribute

### Types of Contributions

- 🐛 **Bug Reports**: Help us identify and fix issues
- ✨ **Feature Requests**: Suggest new functionality
- 📝 **Documentation**: Improve guides and examples
- 🧪 **Testing**: Add test cases and scenarios
- 💻 **Code**: Implement features and fixes
- 🎨 **Design**: Improve user interfaces and experiences
- 🔐 **Security**: Identify vulnerabilities and suggest improvements

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/ZKClaim.git
cd ZKClaim

# Add the original repo as upstream
git remote add upstream https://github.com/sambitsargam/ZKClaim.git
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Set up environment variables
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Build ZK circuits
npm run build:circuits

# Start development environment
npm run dev
```

### 3. Create a Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

## 📋 Contribution Guidelines

### Code Style

**JavaScript/TypeScript:**
```javascript
// Use descriptive names
const zkVerificationResult = await verifyProofOnZkVerify(claim);

// Use async/await
try {
  const result = await apiCall();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw error;
}

// Use object destructuring
const { claimId, patientAddress, amount } = claimData;

// Use template literals
const message = `Processing claim ${claimId} for ${formatCurrency(amount)}`;
```

**React Components:**
```jsx
// Use functional components with hooks
const PatientInterface = () => {
  const [claims, setClaims] = useState([]);
  const { address, isConnected } = useAccount();
  
  useEffect(() => {
    if (isConnected) {
      fetchPatientClaims();
    }
  }, [isConnected, address]);
  
  return (
    <div className="patient-interface">
      {/* Component content */}
    </div>
  );
};

export default PatientInterface;
```

**Solidity:**
```solidity
// Use explicit visibility and modern practices
function submitClaim(
    bytes32 doctorProofHash,
    bytes32 patientProofHash,
    uint256 claimAmount
) external whenNotPaused nonReentrant {
    require(claimAmount > 0, "Amount must be positive");
    
    // Implementation
    emit ClaimSubmitted(claimId, msg.sender, claimAmount);
}
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
# Format: type(scope): description
feat(frontend): add claim submission form
fix(contracts): resolve reentrancy vulnerability
docs(api): update authentication examples
test(circuits): add patient eligibility tests
chore(deps): update dependency versions
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Pull Request Process

1. **Update Documentation**: Ensure your changes are documented
2. **Add Tests**: Include relevant test cases
3. **Test Locally**: Run the full test suite
4. **Small PRs**: Keep pull requests focused and manageable
5. **Clear Description**: Explain what and why, not just how

**PR Template:**
```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

## 🧪 Testing Requirements

### Before Submitting

```bash
# Run all tests
npm run test

# Run linting
npm run lint

# Check formatting
npm run format:check

# Build project
npm run build

# Test circuits
npm run test:circuits

# Integration tests
npm run test:integration
```

### Test Categories

**Unit Tests:**
- Frontend components
- Backend API functions
- Smart contract functions
- Utility functions

**Integration Tests:**
- End-to-end workflows
- API integration
- zkVerify integration
- Database operations

**Circuit Tests:**
- Zero-knowledge proof generation
- Witness calculation
- Proof verification

## 🐛 Bug Reports

When reporting bugs, please include:

### Bug Report Template
```markdown
## Bug Description
A clear and concise description of what the bug is.

## To Reproduce
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
A clear description of what you expected to happen.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
 - OS: [e.g. iOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]
 - Node version
 - Git commit hash

## Additional Context
Add any other context about the problem here.
```

## ✨ Feature Requests

### Feature Request Template
```markdown
## Is your feature request related to a problem?
A clear description of what the problem is. Ex. I'm always frustrated when [...]

## Describe the solution you'd like
A clear and concise description of what you want to happen.

## Describe alternatives you've considered
A clear description of alternative solutions or features you've considered.

## Use Case
Describe the specific use case this feature would address.

## Additional Context
Add any other context or screenshots about the feature request here.
```

## 🔐 Security Issues

**Please do not report security vulnerabilities in public issues.**

Instead:
1. Email us directly at security@zkclaim.io
2. Include detailed information about the vulnerability
3. Allow us time to address the issue before public disclosure

## 📚 Documentation Contributions

### Documentation Types

- **User Guides**: Help users understand features
- **Developer Docs**: Technical implementation details
- **API Documentation**: Endpoint specifications
- **Tutorials**: Step-by-step learning materials
- **Examples**: Code samples and use cases

### Documentation Standards

- Use clear, concise language
- Include code examples
- Add diagrams where helpful
- Keep information up-to-date
- Follow markdown best practices

## 🎨 Design Contributions

### UI/UX Guidelines

- **Accessibility**: Follow WCAG guidelines
- **Mobile-First**: Responsive design principles
- **Privacy-Focused**: Clear data handling indicators
- **Medical Context**: Healthcare-appropriate design
- **Web3 Integration**: Seamless wallet connections

### Design Assets

- Use SVG for icons when possible
- Maintain consistent color schemes
- Follow existing design patterns
- Consider dark/light theme support

## 🌍 Community

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read our [Code of Conduct](CODE_OF_CONDUCT.md).

### Communication Channels

- **GitHub Discussions**: General questions and ideas
- **Issues**: Bug reports and feature requests
- **Pull Requests**: Code contributions
- **Email**: Direct communication for sensitive topics

### Recognition

Contributors will be recognized in:
- README contributors section
- Release notes
- Project documentation
- Community showcases

## 📄 License

By contributing to ZKClaim, you agree that your contributions will be licensed under the MIT License.

## 🚀 Development Roadmap

### Current Focus Areas

1. **Core Functionality**: Basic claim processing workflow
2. **Zero-Knowledge Circuits**: Efficient proof generation
3. **zkVerify Integration**: Professional verification
4. **User Interfaces**: Intuitive user experiences
5. **Documentation**: Comprehensive guides

### Future Priorities

1. **Mobile Applications**: Native iOS/Android apps
2. **Advanced Analytics**: Machine learning insights
3. **Multi-Chain Support**: Cross-chain functionality
4. **Enterprise Features**: Large-scale deployment tools
5. **Regulatory Compliance**: Additional jurisdiction support

### How to Get Involved

- **Beginners**: Start with documentation and small fixes
- **Frontend Developers**: Improve user interfaces and experiences
- **Backend Developers**: Enhance API services and performance
- **Blockchain Developers**: Optimize smart contracts and gas usage
- **Security Researchers**: Audit and improve system security
- **Healthcare Professionals**: Provide domain expertise and feedback

## 🙏 Thank You

Thank you for contributing to ZKClaim! Your efforts help build a more private and efficient healthcare system for everyone.

---

**Questions?** Feel free to open a discussion or reach out to the maintainers. We're here to help you contribute successfully!
