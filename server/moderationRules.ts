// Enhanced moderation system with sophisticated pattern matching to catch various evasion tactics

type ModerationType = 'profanity' | 'hate_speech' | 'inappropriate' | 'concerning' | 'personal_info';

// Define the rule structure
export interface ModerationRule {
  pattern: RegExp;
  type: ModerationType;
  reason: string;
}

// Export the enhanced rules array
export const enhancedModerationRules: ModerationRule[] = [
  // Profanity with common variations and l33t speak replacements
  { pattern: /\b[fF]+[\s_]*[uU]+[\s_]*[cCkK]+[\s_]*[kK]*|[fF][\*]+[cCkK]|[fF][\W_]*[uU][\W_]*[cCkK]|[fF][\W_]*[uU][\W_]*[kK]|f+u+c+k+\b/gi, type: 'profanity', reason: 'Profanity detected' },
  { pattern: /\b[sS]+[\s_]*[hH]+[\s_]*[iI1]+[\s_]*[tT]+|[sS][\*]+[tT]|sh[\W_]*[i1][\W_]*t|s+h+i+t+\b/gi, type: 'profanity', reason: 'Profanity detected' },
  { pattern: /\b[aA]+[\s_]*[sS]+[\s_]*[sS]+|[aA][\*]+[sS]|a[\W_]*s[\W_]*s|a+s+s+\b/gi, type: 'profanity', reason: 'Profanity detected' },
  { pattern: /\b[bB]+[\s_]*[iI1]+[\s_]*[tT]+[\s_]*[cC]+[\s_]*[hH]+|[bB][\*]+[cChH]|b[\W_]*i[\W_]*t[\W_]*c[\W_]*h|b+i+t+c+h+\b/gi, type: 'profanity', reason: 'Profanity detected' },
  { pattern: /\b[cC]+[\s_]*[uU]+[\s_]*[nN]+[\s_]*[tT]+|[cC][\*]+[nN][tT]|c[\W_]*u[\W_]*n[\W_]*t|c+u+n+t+\b/gi, type: 'profanity', reason: 'Profanity detected' },
  { pattern: /\b[dD]+[\s_]*[iI1]+[\s_]*[cCkK]+[\s_]*[kK]*|[dD][\*]+[cCkK]|d[\W_]*i[\W_]*c[\W_]*k|d+i+c+k+\b/gi, type: 'profanity', reason: 'Profanity detected' },
  { pattern: /\b[cC]+[\s_]*[oO0]+[\s_]*[cCkK]+[\s_]*[kK]*|[cC][\*]+[cCkK]|c[\W_]*o[\W_]*c[\W_]*k|c+o+c+k+\b/gi, type: 'profanity', reason: 'Profanity detected' },
  { pattern: /\b[pP]+[\s_]*[uU]+[\s_]*[sS]+[\s_]*[sS]+[\s_]*[yY]+|[pP][\*]+[sS][yY]|p[\W_]*u[\W_]*s[\W_]*s[\W_]*y|p+u+s+s+y+\b/gi, type: 'profanity', reason: 'Profanity detected' },
  { pattern: /\b[wW]+[\s_]*[hH]+[\s_]*[oO0]+[\s_]*[rR]+[\s_]*[eE3]+|[wW][\*]+[rR][eE3]|w[\W_]*h[\W_]*o[\W_]*r[\W_]*e|w+h+o+r+e+\b/gi, type: 'profanity', reason: 'Profanity detected' },
  
  // Hate speech with variations
  { pattern: /\b[nN]+[\s_]*[iI1]+[\s_]*[gG]+[\s_]*[gG]+[\s_]*[eE3]+[\s_]*[rR]+|[nN][\*]+[gG]+[rR]|n[\W_]*i[\W_]*g[\W_]*g[\W_]*e[\W_]*r|n+i+g+g+e+r+\b/gi, type: 'hate_speech', reason: 'Hate speech detected' },
  { pattern: /\b[nN]+[\s_]*[iI1]+[\s_]*[gG]+[\s_]*[gG]+[\s_]*[aA]+|[nN][\*]+[gG]+[aA]|n[\W_]*i[\W_]*g[\W_]*g[\W_]*a|n+i+g+g+a+\b/gi, type: 'hate_speech', reason: 'Hate speech detected' },
  { pattern: /\b[fF]+[\s_]*[aA]+[\s_]*[gG]+[\s_]*[gG]+[\s_]*[oO0]+[\s_]*[tT]+|[fF][\*]+[gG]+[tT]|f[\W_]*a[\W_]*g[\W_]*g[\W_]*o[\W_]*t|f+a+g+g+o+t+\b/gi, type: 'hate_speech', reason: 'Hate speech detected' },
  { pattern: /\b[rR]+[\s_]*[eE3]+[\s_]*[tT]+[\s_]*[aA]+[\s_]*[rR]+[\s_]*[dD]+|[rR][\*]+[tT][rR][dD]|r[\W_]*e[\W_]*t[\W_]*a[\W_]*r[\W_]*d|r+e+t+a+r+d+\b/gi, type: 'hate_speech', reason: 'Hate speech detected' },
  { pattern: /\b[sS]+[\s_]*[pP]+[\s_]*[aA]+[\s_]*[sS]+[\s_]*[tT]+[\s_]*[iI1]+[\s_]*[cC]+|[sS][\*]+[sS][tT][cC]|s[\W_]*p[\W_]*a[\W_]*s[\W_]*t[\W_]*i[\W_]*c|s+p+a+s+t+i+c+\b/gi, type: 'hate_speech', reason: 'Hate speech detected' },
  
  // Inappropriate content with variations
  { pattern: /\b[pP]+[\s_]*[oO0]+[\s_]*[rR]+[\s_]*[nN]+|[pP][\*]+[rR][nN]|p[\W_]*o[\W_]*r[\W_]*n|p+o+r+n+\b/gi, type: 'inappropriate', reason: 'Inappropriate content detected' },
  { pattern: /\b[pP]+[\s_]*[oO0]+[\s_]*[rR]+[\s_]*[nN]+[\s_]*[hH]+[\s_]*[uU]+[\s_]*[bB]+|[pP][\*]+[rR][nN][hH][bB]|p[\W_]*o[\W_]*r[\W_]*n[\W_]*h[\W_]*u[\W_]*b|p+o+r+n+h+u+b+\b/gi, type: 'inappropriate', reason: 'Inappropriate content detected' },
  { pattern: /\b[xX]+[\s_]*[vV]+[\s_]*[iI1]+[\s_]*[dD]+[\s_]*[eE3]+[\s_]*[oO0]+[\s_]*[sS]+|[xX][\*]+[vV][dD][sS]|x[\W_]*v[\W_]*i[\W_]*d[\W_]*e[\W_]*o[\W_]*s|x+v+i+d+e+o+s+\b/gi, type: 'inappropriate', reason: 'Inappropriate content detected' },
  { pattern: /\b[oO0]+[\s_]*[nN]+[\s_]*[lL]+[\s_]*[yY]+[\s_]*[fF]+[\s_]*[aA]+[\s_]*[nN]+[\s_]*[sS]+|[oO0][\*]+[nN][lL][yY][fF][nN][sS]|o[\W_]*n[\W_]*l[\W_]*y[\W_]*f[\W_]*a[\W_]*n[\W_]*s|o+n+l+y+f+a+n+s+\b/gi, type: 'inappropriate', reason: 'Inappropriate content detected' },
  { pattern: /\b[sS]+[\s_]*[eE3]+[\s_]*[xX]+|[sS][\*]+[xX]|s[\W_]*e[\W_]*x|s+e+x+\b/gi, type: 'inappropriate', reason: 'Inappropriate content detected' },
  { pattern: /\b[sS]+[\s_]*[eE3]+[\s_]*[xX]+[\s_]*[yY]+|[sS][\*]+[xX][yY]|s[\W_]*e[\W_]*x[\W_]*y|s+e+x+y+\b/gi, type: 'inappropriate', reason: 'Inappropriate content detected' },
  
  // Concerning content with variations
  { pattern: /\b[sS]+[\s_]*[uU]+[\s_]*[iI1]+[\s_]*[cC]+[\s_]*[iI1]+[\s_]*[dD]+[\s_]*[eE3]+|[sS][\*]+[cC][dD]|s[\W_]*u[\W_]*i[\W_]*c[\W_]*i[\W_]*d[\W_]*e|s+u+i+c+i+d+e+\b/gi, type: 'concerning', reason: 'Concerning content detected' },
  { pattern: /\b[kK]+[\s_]*[iI1]+[\s_]*[lL]+[\s_]*[lL][\s_]*[\s_]*[mM]+[\s_]*[yY]+[\s_]*[sS]+[\s_]*[eE3]+[\s_]*[lL]+[\s_]*[fF]+/gi, type: 'concerning', reason: 'Concerning content detected' },
  { pattern: /\b[hH]+[\s_]*[aA]+[\s_]*[nN]+[\s_]*[gG][\s_]*[\s_]*[mM]+[\s_]*[yY]+[\s_]*[sS]+[\s_]*[eE3]+[\s_]*[lL]+[\s_]*[fF]+/gi, type: 'concerning', reason: 'Concerning content detected' },
  { pattern: /\b[jJ]+[\s_]*[uU]+[\s_]*[mM]+[\s_]*[pP][\s_]*[\s_]*[oO0]+[\s_]*[fF]+[\s_]*[fF]+/gi, type: 'concerning', reason: 'Concerning content detected' },
  
  // Personal information sharing with variations
  { pattern: /\b[aA]+[\s_]*[dD]+[\s_]*[dD]+[\s_]*[rR]+[\s_]*[eE3]+[\s_]*[sS]+[\s_]*[sS]+/gi, type: 'personal_info', reason: 'Potential personal information sharing detected' },
  { pattern: /\b[pP]+[\s_]*[hH]+[\s_]*[oO0]+[\s_]*[nN]+[\s_]*[eE3][\s_]*[\s_]*[nN]+[\s_]*[uU]+[\s_]*[mM]+[\s_]*[bB]+[\s_]*[eE3]+[\s_]*[rR]+/gi, type: 'personal_info', reason: 'Potential personal information sharing detected' },
  { pattern: /\b[cC]+[\s_]*[rR]+[\s_]*[eE3]+[\s_]*[dD]+[\s_]*[iI1]+[\s_]*[tT][\s_]*[\s_]*[cC]+[\s_]*[aA]+[\s_]*[rR]+[\s_]*[dD]+/gi, type: 'personal_info', reason: 'Potential personal information sharing detected' },
  { pattern: /\b[pP]+[\s_]*[aA]+[\s_]*[sS]+[\s_]*[sS]+[\s_]*[wW]+[\s_]*[oO0]+[\s_]*[rR]+[\s_]*[dD]+/gi, type: 'personal_info', reason: 'Potential personal information sharing detected' },
  { pattern: /\b[sS]+[\s_]*[sS]+[\s_]*[nN]/gi, type: 'personal_info', reason: 'Potential personal information sharing detected' },
  { pattern: /\b[sS]+[\s_]*[oO0]+[\s_]*[cC]+[\s_]*[iI1]+[\s_]*[aA]+[\s_]*[lL][\s_]*[\s_]*[sS]+[\s_]*[eE3]+[\s_]*[cC]+[\s_]*[uU]+[\s_]*[rR]+[\s_]*[iI1]+[\s_]*[tT]+[\s_]*[yY]+/gi, type: 'personal_info', reason: 'Potential personal information sharing detected' },
];

// Helper function to moderate content
export function moderateContent(content: string): {
  isAllowed: boolean;
  moderatedContent: string;
  reason?: string;
  moderationType?: ModerationType;
} {
  let moderatedContent = content;
  let hasViolation = false;
  let moderationType: ModerationType | undefined = undefined;
  let reason: string | undefined = undefined;

  // Check each rule against the content
  for (const rule of enhancedModerationRules) {
    if (rule.pattern.test(content)) {
      // Replace the matched content with asterisks
      moderatedContent = moderatedContent.replace(rule.pattern, (match) => '*'.repeat(match.length));
      hasViolation = true;
      moderationType = rule.type;
      reason = rule.reason;
      break; // Stop at the first violation for simplicity
    }
  }

  return {
    isAllowed: !hasViolation,
    moderatedContent,
    moderationType,
    reason,
  };
}