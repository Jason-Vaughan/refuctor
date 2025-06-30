const fs = require('fs-extra');
const path = require('path');

/**
 * Markdown Fixer Goon - Aggressive markdown debt elimination
 * Part of the Refuctor Debt Collection Agency
 * 
 * "When your markdown is so broken even the linter files for bankruptcy"
 */
class MarkdownFixerGoon {
  constructor() {
    this.name = 'Markdown Fixer';
    this.personality = 'Aggressive document restructuring specialist';
    this.fixCount = 0;
    this.snarkLevel = 11; // Out of 10, naturally
  }

  /**
   * Main entry point - Fix all markdown violations in a file
   * @param {string} filePath - Path to markdown file
   * @param {boolean} dryRun - Preview changes without applying
   * @returns {Object} Fix report with before/after metrics
   */
  async eliminateDebt(filePath, dryRun = false) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}. Even I can't fix what doesn't exist.`);
    }

    const originalContent = await fs.readFile(filePath, 'utf8');
    const fixedContent = this.applyAllFixes(originalContent);
    
    const report = {
      filePath,
      originalLines: originalContent.split('\n').length,
      fixedLines: fixedContent.split('\n').length,
      fixesApplied: this.fixCount,
      dryRun,
      message: this.generateSnarkMessage()
    };

    if (!dryRun) {
      await fs.writeFile(filePath, fixedContent, 'utf8');
      report.message += ' Debt eliminated. You\'re welcome.';
    } else {
      report.message += ' Preview mode - your debt remains unforgiven.';
    }

    return report;
  }

  /**
   * Apply all markdown fixes to content
   * @param {string} content - Original markdown content
   * @returns {string} Fixed markdown content
   */
  applyAllFixes(content) {
    this.fixCount = 0;
    let fixed = content;

    // Fix in order of priority (most impactful first)
    fixed = this.fixBlankLinesAroundHeadings(fixed);
    fixed = this.fixBlankLinesAroundLists(fixed);
    fixed = this.fixBlankLinesAroundCodeBlocks(fixed);
    fixed = this.fixCodeBlockLanguages(fixed);
    fixed = this.fixTrailingSpaces(fixed);
    fixed = this.fixLineLengthViolations(fixed);
    fixed = this.fixFinalNewline(fixed);

    return fixed;
  }

  /**
   * Fix MD022 - Headings should be surrounded by blank lines
   */
  fixBlankLinesAroundHeadings(content) {
    const lines = content.split('\n');
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isHeading = /^#{1,6}\s/.test(line);
      
      if (isHeading) {
        // Add blank line before heading (if not first line and previous isn't blank)
        if (i > 0 && lines[i - 1].trim() !== '' && result[result.length - 1]?.trim() !== '') {
          result.push('');
          this.fixCount++;
        }
        
        result.push(line);
        
        // Add blank line after heading (if not last line and next isn't blank)
        if (i < lines.length - 1 && lines[i + 1].trim() !== '') {
          result.push('');
          this.fixCount++;
        }
      } else {
        result.push(line);
      }
    }
    
    return result.join('\n');
  }

  /**
   * Fix MD032 - Lists should be surrounded by blank lines
   */
  fixBlankLinesAroundLists(content) {
    const lines = content.split('\n');
    const result = [];
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isListItem = /^[\s]*[-*+]\s/.test(line) || /^[\s]*\d+\.\s/.test(line);
      
      if (isListItem && !inList) {
        // Starting a list - add blank line before if needed
        if (i > 0 && lines[i - 1].trim() !== '' && result[result.length - 1]?.trim() !== '') {
          result.push('');
          this.fixCount++;
        }
        inList = true;
        result.push(line);
      } else if (!isListItem && inList) {
        // Ending a list - add blank line after if needed
        if (line.trim() !== '') {
          result.push('');
          this.fixCount++;
        }
        inList = false;
        result.push(line);
      } else {
        result.push(line);
      }
    }
    
    return result.join('\n');
  }

  /**
   * Fix MD031 - Fenced code blocks should be surrounded by blank lines
   */
  fixBlankLinesAroundCodeBlocks(content) {
    const lines = content.split('\n');
    const result = [];
    let inCodeBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isCodeFence = /^```/.test(line);
      
      if (isCodeFence && !inCodeBlock) {
        // Starting code block - add blank line before if needed
        if (i > 0 && lines[i - 1].trim() !== '' && result[result.length - 1]?.trim() !== '') {
          result.push('');
          this.fixCount++;
        }
        inCodeBlock = true;
        result.push(line);
      } else if (isCodeFence && inCodeBlock) {
        // Ending code block
        result.push(line);
        inCodeBlock = false;
        
        // Add blank line after if needed
        if (i < lines.length - 1 && lines[i + 1].trim() !== '') {
          result.push('');
          this.fixCount++;
        }
      } else {
        result.push(line);
      }
    }
    
    return result.join('\n');
  }

  /**
   * Fix MD040 - Fenced code blocks should have a language specified
   */
  fixCodeBlockLanguages(content) {
    // Replace bare ``` with ```text (safest generic option)
    const fixed = content.replace(/^```\s*$/gm, '```text');
    const matches = content.match(/^```\s*$/gm);
    if (matches) {
      this.fixCount += matches.length;
    }
    return fixed;
  }

  /**
   * Fix MD009 - Remove trailing spaces
   */
  fixTrailingSpaces(content) {
    const lines = content.split('\n');
    const result = lines.map(line => {
      const trimmed = line.replace(/\s+$/, '');
      if (trimmed !== line) {
        this.fixCount++;
      }
      return trimmed;
    });
    return result.join('\n');
  }

  /**
   * Fix MD013 - Line length violations (smart wrapping)
   */
  fixLineLengthViolations(content, maxLength = 80) {
    const lines = content.split('\n');
    const result = [];
    
    for (let line of lines) {
      if (line.length <= maxLength) {
        result.push(line);
        continue;
      }

      // Don't wrap these line types
      if (this.shouldSkipLineWrapping(line)) {
        result.push(line);
        continue;
      }

      // Attempt intelligent wrapping
      const wrapped = this.wrapLineIntelligently(line, maxLength);
      result.push(...wrapped);
      this.fixCount++;
    }
    
    return result.join('\n');
  }

  /**
   * Determine if line should be skipped for wrapping
   */
  shouldSkipLineWrapping(line) {
    return (
      /^```/.test(line) ||           // Code fences
      /^\|/.test(line) ||            // Table rows
      /^#{1,6}\s/.test(line) ||      // Headers (risky to wrap)
      /^\s*[-*+]\s/.test(line) ||    // List items (handle specially)
      /^\s*\d+\.\s/.test(line) ||    // Numbered lists
      /^\[.*\]:/.test(line) ||       // Link references
      line.trim().startsWith('http') // URLs
    );
  }

  /**
   * Intelligently wrap a long line
   */
  wrapLineIntelligently(line, maxLength) {
    const result = [];
    let remaining = line;
    
    while (remaining.length > maxLength) {
      let cutPoint = this.findBestCutPoint(remaining, maxLength);
      
      if (cutPoint === -1) {
        // No good cut point found, take what we can
        cutPoint = maxLength;
      }
      
      result.push(remaining.substring(0, cutPoint).trimEnd());
      remaining = remaining.substring(cutPoint).trimStart();
    }
    
    if (remaining.length > 0) {
      result.push(remaining);
    }
    
    return result;
  }

  /**
   * Find the best point to cut a line for wrapping
   */
  findBestCutPoint(line, maxLength) {
    // Look for natural break points in order of preference
    const breakPoints = [
      { pattern: /[.!?]\s+/, priority: 1 },    // Sentence endings
      { pattern: /,\s+/, priority: 2 },        // Commas
      { pattern: /;\s+/, priority: 2 },        // Semicolons
      { pattern: /:\s+/, priority: 3 },        // Colons
      { pattern: /\s+[-–—]\s+/, priority: 3 }, // Dashes
      { pattern: /\s+/, priority: 4 }          // Any whitespace
    ];
    
    let bestCut = -1;
    let bestPriority = 999;
    
    for (const bp of breakPoints) {
      const matches = Array.from(line.matchAll(new RegExp(bp.pattern.source, 'g')));
      
      for (const match of matches) {
        const cutPoint = match.index + match[0].length;
        
        if (cutPoint <= maxLength && bp.priority < bestPriority) {
          bestCut = cutPoint;
          bestPriority = bp.priority;
        }
      }
    }
    
    return bestCut;
  }

  /**
   * Fix MD047 - Files should end with a single newline character
   */
  fixFinalNewline(content) {
    if (!content.endsWith('\n')) {
      this.fixCount++;
      return content + '\n';
    } else if (content.endsWith('\n\n')) {
      // Remove extra newlines
      const trimmed = content.replace(/\n+$/, '\n');
      if (trimmed !== content) {
        this.fixCount++;
      }
      return trimmed;
    }
    return content;
  }

  /**
   * Generate snarky status message based on fixes applied
   */
  generateSnarkMessage() {
    if (this.fixCount === 0) {
      return 'Your markdown is already cleaner than a loan shark\'s books. Impressive.';
    } else if (this.fixCount < 10) {
      return `Fixed ${this.fixCount} violations. Your document was only slightly embarrassing.`;
    } else if (this.fixCount < 50) {
      return `Eliminated ${this.fixCount} violations. Your markdown was in serious foreclosure.`;
    } else {
      return `Obliterated ${this.fixCount} violations. Your document was so broken it filed for bankruptcy.`;
    }
  }

  /**
   * Preview fixes without applying them
   */
  async previewFixes(filePath) {
    return await this.eliminateDebt(filePath, true);
  }
}

// Export singleton instance
const markdownFixerGoon = new MarkdownFixerGoon();
module.exports = { markdownFixerGoon, MarkdownFixerGoon };