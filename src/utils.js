import Q from 'q'
import { TweenLite } from "gsap"
import 'framework7'

var f7 = null;

export default {
  getF7: function(){
    // comment this
    let okLocalized, cancelLocalized
    try {
      okLocalized = window.app.$t('message.ok')
      cancelLocalized = window.app.$t('message.cancel')
    } catch(error) {
      okLocalized = "Ok",
      cancelLocalized = "Cancel"
    }
    if (!f7) {
      f7 = new Framework7({
        statusbarOverlay: false,
        modalButtonOk: okLocalized,
        modalButtonCancel: cancelLocalized,
      })
    }
    return f7
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
  },

  recordAudioPromise: function() {
    var deferred = Q.defer();
    if (!navigator.device || !navigator.device.capture) {
      deferred.reject('Audio Capture object is not available');
    } else {
      navigator.device.capture.captureAudio(
        function(audios) {
          if (audios.length != 1) {
            deferred.reject("Wrong number of audios returned")
          } else {
            deferred.resolve(audios[0]);
          }
        }, deferred.reject,  { limit: 1, duration: 10 }
      );
    }
    return deferred.promise;
  },

  animationChain: function(element, duration, params) {
    var deferred = Q.defer();
    params.onComplete = function() {
      deferred.resolve();
    }
    TweenLite.to(element, 1, params);
    return deferred.promise;
  },

  waitForSeconds: function(sec) {
    var deferred = Q.defer();
    window.setTimeout(function(){
      deferred.resolve();
    }, sec * 1000);
    return deferred.promise;
  },

  playAudioChain: function(audioSrc) {
    var deferred = Q.defer();
    var aud = new Audio();
    aud.src=audioSrc;
    aud.onended = function(){
      console.log('play audio done')
      deferred.resolve('audio end: ' + audioSrc);
    };
    aud.play().catch(console.log);
    return deferred.promise;
  },

  mediaPluginPlayAudio: function(audioSrc) {
    var deferred = Q.defer();
    var media = new Media(audioSrc, function(){
      this.stop()
      this.release()
      deferred.resolve()
    }, function(){
      this.stop()
      this.release()
      deferred.reject()
    });
    media.play()
    return deferred.promise;
  },

  // For dragging
  getNumberOfCardsInPage: function(groupEl) {
    let elChildren = groupEl.getElementsByClassName('card-group-item')
    let count = 0;
    for (var i = 0; i< elChildren.length; i ++) {
      // let result = elChildren[i].querySelector('[draggable="false"]')
      let child = elChildren[i]
      var drag = child.attributes.getNamedItem('draggable')
      if (drag && drag.value == 'false') {
        console.log('found!!!!!')
        count++
        break;
      }
    }
    console.log(`${elChildren.length} - ${count};`);
    return elChildren.length - count;
  },

  getFirstNonGhostNode: function(groupEl) {
    let elChildren = groupEl.getElementsByClassName('card-group-item')
    let firstChild = groupEl.firstChild
    let drag = firstChild.attributes.getNamedItem('draggable')
    if (drag && drag.value == 'false') {
      console.log('first child is a ghost')
      return elChildren[1]
    } else {
      return groupEl.firstChild
    }
  },
    
  getLastNonGhostNode: function(groupEl) {
    let elChildren = groupEl.getElementsByClassName('card-group-item')
    let lastChild = groupEl.lastChild
    let drag = lastChild.attributes.getNamedItem('draggable')
    if (drag && drag.value == 'false') {
      console.log('last child is a ghost')
      return elChildren[elChildren.length - 2]
    } else {
      return groupEl.lastChild
    }
  },

  emptyPromise: function(){
    return Q()
  }
}
