export default {
  isCordova: () => {
    return typeof cordova != 'undefined';
  },

  /*
   * Convert an 1-D array to 2-D array with each sub-array has a size
   * of row * col. This is a helper function to divide card list into
   * multiple pages.
   *
   * E.g. cards = [1,2,3,4,5,6,7,8,9] to 2x2 grid. result should be:
   * [ [ 1, 2, 3, 4 ],
   *   [ 5, 6, 7, 8 ],
   *   [ 9 ]
   * ]
   */
  arrangeCards: function(cardList, row, col) {
    var pages = cardList.length / (row * col) + 1;
    var arrangedCards = [];
    for (var i = 0; i < pages; i++) {
      var page = cardList.slice(i * row * col, (i + 1) * row * col);
      if (page.length == 0) break;
      arrangedCards.push(page);
    }
    return arrangedCards;
  },

  /* Arrange cards to pages, and row x col grid on each page
  *
  * E.g. cards = [1,2,3,4,5,6,7,8,9] to 2x2 grid. result should be:
  * [ [ [1, 2], [3, 4] ],
  *   [ [5, 6], [7, 8] ],
  *   [ [9] ]
  * ]
  */
  sortCards: function (cards, row, col) {
    var pages = cards.length / (row * col) + 1;
    var sortedCards = [];
    for (var i = 0; i < pages; i++) {
      var page = cards.slice(i * row * col, (i + 1) * row * col);
      if (page.length === 0) break; // avoid pushing blank page in.
      var sortedPage = [];
      for (var j = 0; j <= page.length / col; j++) {
        var rowConent = page.slice(j * col, (j + 1) * col);
        if (rowConent.length === 0) break; // avoid pushing blank row in.
        sortedPage.push(rowConent);
      }
      sortedCards.push(sortedPage);
    }
    return sortedCards;
  }
}