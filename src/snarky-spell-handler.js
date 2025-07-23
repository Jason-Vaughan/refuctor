const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Smart Snarky Language Handler
 * Intelligently detects and manages project-specific snarky vocabulary
 */
class SnarkySpellHandler {
  constructor() {
    // Common patterns that indicate intentional snarky language
    this.snarkyPatterns = [
      // Financial/debt metaphors
      /^(fore|repo|debt|loan|bank|cash|money|pay|owe|interest)/i,
      // Slang endings
      /^.*(ify|ified|ness|age|ism|ation|inator|izer)$/i,
      // Compound words with known roots
      /^(shit|fuck|damn|hell|ass|bitch|bastard|cock|dick).*$/i,
      // Tech slang
      /^(refact|config|auth|admin|dev|ops|api|cli|ui|ux)/i,
      // Made-up portmanteau words
      /^.*(uation|lationship|tastic|pocalypse|mageddon|fest|athon)$/i,
      // Intentional misspellings
      /.*[xyz]{2,}.*|.*[0-9].*|.*[!@#$%^&*()].*/ 
    ];

    // Words that are definitely typos (common mistakes)
    this.definiteTypos = [
      'teh', 'hte', 'adn', 'nad', 'recieve', 'seperate', 'occured',
      'neccessary', 'existance', 'definately', 'goverment', 'enviroment'
    ];

    // Confidence levels for auto-handling
    this.confidence = {
      DEFINITELY_SNARKY: 0.9,
      PROBABLY_SNARKY: 0.7,
      UNSURE: 0.5,
      PROBABLY_TYPO: 0.3,
      DEFINITELY_TYPO: 0.1
    };
  }

  /**
   * Analyze spelling issues and categorize them
   */
  async analyzeSpellingIssues(projectPath, spellingIssues) {
    const analysis = {
      definiteTypos: [],
      likelySnarky: [],
      unsure: [],
      suggestions: []
    };

    for (const issue of spellingIssues) {
      const word = issue.word;
      const confidence = this.calculateSnarkyConfidence(word, issue);
      
      if (confidence >= this.confidence.DEFINITELY_SNARKY) {
        analysis.likelySnarky.push({ ...issue, confidence, reason: 'Matches snarky patterns' });
      } else if (confidence <= this.confidence.DEFINITELY_TYPO) {
        analysis.definiteTypos.push({ ...issue, confidence, reason: 'Common typo pattern' });
      } else {
        analysis.unsure.push({ ...issue, confidence });
      }
    }

    // Generate smart suggestions
    analysis.suggestions = await this.generateSmartSuggestions(analysis);

    return analysis;
  }

  /**
   * Calculate confidence that a word is intentionally snarky
   */
  calculateSnarkyConfidence(word, issue) {
    let confidence = 0.5; // Start neutral

    // Check if it's a known typo
    if (this.definiteTypos.includes(word.toLowerCase())) {
      return this.confidence.DEFINITELY_TYPO;
    }

    // Check snarky patterns
    for (const pattern of this.snarkyPatterns) {
      if (pattern.test(word)) {
        confidence += 0.2;
      }
    }

    // Context clues from filename
    const filename = issue.file || '';
    if (filename.includes('README') || filename.includes('docs') || filename.includes('.md')) {
      confidence += 0.1; // Documentation more likely to have intentional terms
    }

    // Length heuristics
    if (word.length > 12) {
      confidence += 0.1; // Long words more likely intentional compounds
    }
    if (word.length < 4) {
      confidence -= 0.1; // Short words more likely typos
    }

    // Capitalization patterns
    if (word[0] === word[0].toUpperCase() && word.length > 1) {
      confidence += 0.1; // Proper nouns more likely intentional
    }

    // Technical file context
    if (filename.includes('.js') || filename.includes('.ts') || filename.includes('config')) {
      confidence += 0.05; // Code files might have intentional tech slang
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Generate smart suggestions for handling spelling issues
   */
  async generateSmartSuggestions(analysis) {
    const suggestions = [];

    if (analysis.definiteTypos.length > 0) {
      suggestions.push({
        action: 'fix_typos',
        description: `🔧 Auto-fix ${analysis.definiteTypos.length} obvious typos`,
        items: analysis.definiteTypos.map(t => t.word),
        confidence: 'high'
      });
    }

    if (analysis.likelySnarky.length > 0) {
      suggestions.push({
        action: 'add_to_dictionary',
        description: `📝 Add ${analysis.likelySnarky.length} likely snarky terms to project dictionary`,
        items: analysis.likelySnarky.map(s => s.word),
        confidence: 'high'
      });
    }

    if (analysis.unsure.length > 0) {
      suggestions.push({
        action: 'review_manually',
        description: `🤔 Review ${analysis.unsure.length} uncertain terms manually`,
        items: analysis.unsure.map(u => ({ word: u.word, confidence: u.confidence })),
        confidence: 'manual'
      });
    }

    return suggestions;
  }

  /**
   * Create or update project cspell.json with snarky terms
   */
  async updateProjectDictionary(projectPath, wordsToAdd, options = {}) {
    const configPath = path.join(projectPath, 'cspell.json');
    let config;

    // Load existing config or create new one
    if (fs.existsSync(configPath)) {
      config = await fs.readJson(configPath);
    } else {
      config = this.createBasicCspellConfig();
    }

    // Ensure words array exists
    if (!config.words) {
      config.words = [];
    }

    // Add new words (avoid duplicates)
    const newWords = wordsToAdd.filter(word => !config.words.includes(word));
    config.words.push(...newWords);
    config.words.sort(); // Keep alphabetized

    // Add comment about snarky language if this is the first time
    if (newWords.length > 0 && !config._snarkyLanguageSupport) {
      config._snarkyLanguageSupport = {
        description: "This project uses intentional snarky language and technical slang",
        addedBy: "Refuctor Debt Collection Agency",
        timestamp: new Date().toISOString()
      };
    }

    // Write updated config
    await fs.writeJson(configPath, config, { spaces: 2 });

    return {
      configPath,
      wordsAdded: newWords.length,
      totalWords: config.words.length,
      newWords
    };
  }

  /**
   * Create a basic cspell.json configuration
   */
  createBasicCspellConfig() {
    return {
      "version": "0.2",
      "language": "en",
      "words": [],
      "ignoreWords": [],
      "ignorePaths": [
        "node_modules/**",
        ".git/**",
        "dist/**",
        "build/**",
        "coverage/**",
        "*.png",
        "*.jpg",
        "*.jpeg",
        "*.gif",
        "*.svg",
        "*.ico"
      ],
      "caseSensitive": false,
      "allowCompoundWords": true,
      "languageSettings": [
        {
          "languageId": "markdown",
          "allowCompoundWords": true,
          "caseSensitive": false
        },
        {
          "languageId": "javascript",
          "allowCompoundWords": true,
          "caseSensitive": true
        },
        {
          "languageId": "typescript",
          "allowCompoundWords": true,
          "caseSensitive": true
        }
      ]
    };
  }

  /**
   * Interactive prompt for handling spelling issues
   */
  async promptUserForSpellingDecisions(analysis) {
    const decisions = {
      addToDictionary: [],
      fixAsTypos: [],
      ignore: []
    };

    console.log('='.repeat(50));

    // Handle obvious cases first
    if (analysis.definiteTypos.length > 0) {
      console.log(`\n🔧 OBVIOUS TYPOS (${analysis.definiteTypos.length}):`);
      analysis.definiteTypos.forEach(typo => {
      });
      
      // In a real CLI, you'd use inquirer or similar for prompts
      // For now, we'll return the analysis for the calling code to handle
      decisions.fixAsTypos = analysis.definiteTypos.map(t => t.word);
    }

    if (analysis.likelySnarky.length > 0) {
      console.log(`\n📝 LIKELY SNARKY TERMS (${analysis.likelySnarky.length}):`);
      analysis.likelySnarky.forEach(snarky => {
        console.log(`   ${snarky.word} in ${snarky.file}:${snarky.line} (${Math.round(snarky.confidence * 100)}% confident)`);
      });
      
      decisions.addToDictionary = analysis.likelySnarky.map(s => s.word);
    }

    if (analysis.unsure.length > 0) {
      console.log(`\n🤔 UNCERTAIN TERMS (${analysis.unsure.length}):`);
      analysis.unsure.forEach(uncertain => {
        console.log(`   ${uncertain.word} in ${uncertain.file}:${uncertain.line} (${Math.round(uncertain.confidence * 100)}% confident)`);
      });
    }

    return decisions;
  }

  /**
   * Generate a report of snarky language handling
   */
  generateSnarkyReport(analysis, decisions) {
    const report = [];
    
    report.push('🎯 SNARKY LANGUAGE ANALYSIS REPORT');
    report.push('='.repeat(40));
    
    if (decisions.addToDictionary.length > 0) {
      report.push(`\n✅ ADDED TO DICTIONARY (${decisions.addToDictionary.length}):`);
      decisions.addToDictionary.forEach(word => {
        report.push(`   📝 ${word} - Recognized as intentional snarky language`);
      });
    }

    if (decisions.fixAsTypos.length > 0) {
      report.push(`\n🔧 TYPOS TO FIX (${decisions.fixAsTypos.length}):`);
      decisions.fixAsTypos.forEach(word => {
        report.push(`   ❌ ${word} - Flagged as genuine typo`);
      });
    }

    if (decisions.ignore.length > 0) {
      report.push(`\n🤷 IGNORED (${decisions.ignore.length}):`);
      decisions.ignore.forEach(word => {
        report.push(`   ⏭️ ${word} - User chose to ignore`);
      });
    }

    report.push(`\n📊 SUMMARY:`);
    report.push(`   Total spelling issues analyzed: ${analysis.definiteTypos.length + analysis.likelySnarky.length + analysis.unsure.length}`);
    report.push(`   Confidence in snarky detection: ${Math.round((analysis.likelySnarky.length / (analysis.definiteTypos.length + analysis.likelySnarky.length + analysis.unsure.length)) * 100)}%`);

    return report.join('\n');
  }
}

module.exports = SnarkySpellHandler; 