let html = `
< id="mm-ads-leaderboard-header_1-0" class="comp mm-ads-leaderboard-header mm-ads-leaderboard-flex-1 mm-ads-flexible-leaderboard mm-ads-flexible-ad mm-ads-gpt-adunit has-right-label leaderboard has-right-label has-left-label gpt leaderboard "></><>< class="loc article-header">< id="travelandleisure-article-header_1-0" class="comp travelandleisure-article-header mntl-article-header"><>We <>independently evaluate</>all of our recommendations. If you click on links we provide, we may receive compensation.</><>Hotels + Resorts</><>`

// Step 2: Process the 'id' attributes
html = html.replace(/(class=")([^"]+)(")/g, (match, p1, p2, p3) => {
  // Define allowed keywords for 'id'
  console.log(p2.split(/\s+/))
  const allowedWords = ['nav', 'footer', 'navigation', 'header'];
  const filteredWords = allowedWords.filter(word => p2.includes(word))

  if (filteredWords.length > 0) {
    // If any allowed word is found, replace the entire id attribute with that word
    return p1 + filteredWords[0] + p3;
  } else {
    // Otherwise, leave the id attribute as is
    return match;
  }
});

console.log(html)
