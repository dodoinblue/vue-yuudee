import Q from 'q'

export default {
  isCordova: () => {
    console.log(typeof cordova);
    return typeof cordova != 'undefined';
  },
  isBrowser: () => {
    return typeof cordova == 'undefined' || cordova.platformId == 'browser'
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
  },

  takePicturePromise: function(options) {
    var deferred = Q.defer();
    if (!navigator.camera) {
      deferred.reject('Camera object is not available');
    } else {
      navigator.camera.getPicture(deferred.resolve, deferred.reject, options);
    }
    return deferred.promise;
  },

  choosePicturePromise: function() {
    var deferred = Q.defer();
    if (!window.imagePicker) {
      deferred.reject('ImagePicker object is not available');
    } else {
      var options = options = {
        maximumImagesCount: 1,
        quality: 50,
      };
      window.imagePicker.getPictures(function(images){
        if (images.length != 1) {
          deferred.reject("Error choosing image.")
        } else {
          deferred.resolve(images[0]);
        }
      }, deferred.reject, options);
    }
    return deferred.promise;
  }
}
